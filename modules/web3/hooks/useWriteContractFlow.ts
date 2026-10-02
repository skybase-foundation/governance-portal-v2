import {
  UseSimulateContractParameters,
  useAccount,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
  Config,
  ResolvedRegister
} from 'wagmi';
import { isRevertedError } from '../helpers/errors';
import { useEffect, useMemo } from 'react';
import type { WriteHook } from '../types/hooks';
import { type Abi, type ContractFunctionArgs, type ContractFunctionName } from 'viem';
import { SAFE_CONNECTOR_ID } from '../constants/wallets';
import { useWaitForSafeTxHash } from './useWaitForSafeTxHash';

type UseWriteContractFlowParameters<
  abi extends Abi | readonly unknown[] = Abi,
  functionName extends ContractFunctionName<abi, 'nonpayable' | 'payable'> = ContractFunctionName<
    abi,
    'nonpayable' | 'payable'
  >,
  args extends ContractFunctionArgs<abi, 'nonpayable' | 'payable', functionName> = ContractFunctionArgs<
    abi,
    'nonpayable' | 'payable',
    functionName
  >,
  config extends Config = Config,
  chainId extends config['chains'][number]['id'] | undefined = undefined
> = UseSimulateContractParameters<abi, functionName, args, config, chainId> & {
  enabled: boolean;
  gcTime?: number;
  onStart?: (hash: string) => void;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error, hash: string) => void;
};

export function useWriteContractFlow<
  abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, 'nonpayable' | 'payable'>,
  args extends ContractFunctionArgs<abi, 'nonpayable' | 'payable', functionName>,
  config extends Config = ResolvedRegister['config'],
  chainId extends config['chains'][number]['id'] | undefined = undefined
>(parameters: UseWriteContractFlowParameters<abi, functionName, args, config, chainId>): WriteHook {
  const {
    enabled,
    gcTime,
    onSuccess = () => null,
    onError = () => null,
    onStart = () => null,
    ...useSimulateContractParamters
  } = parameters;

  const { address: account, connector } = useAccount();

  // Prepare tx config
  const {
    data: simulationData,
    refetch,
    isLoading: isSimulationLoading,
    error: simulationError
  } = useSimulateContract({
    ...useSimulateContractParamters,
    // Tenderly Admin RPCs expose unlocked accounts through `eth_accounts`.
    // Override that default only after wagmi has a connected wallet; passing
    // `account: undefined` makes disconnected pages request a connector client.
    ...(useSimulateContractParamters.account || account
      ? { account: useSimulateContractParamters.account ?? account }
      : {}),
    query: { ...useSimulateContractParamters.query, enabled, gcTime: gcTime || 30000 }
  } as UseSimulateContractParameters);

  const {
    writeContract,
    error: writeError,
    data: mutationHash
  } = useWriteContract({
    mutation: {
      onSuccess: (hash: `0x${string}`) => {
        if (onStart) {
          onStart(hash);
        }
      },
      onError: (err: Error) => {
        if (onError) {
          onError(err, mutationHash || '');
        }
      }
    }
  });

  // Workaround to get `txHash` from Safe connector
  const isSafeConnector = connector?.id === SAFE_CONNECTOR_ID;

  const eventHash = useWaitForSafeTxHash({
    chainId: parameters.chainId,
    safeTxHash: mutationHash,
    isSafeConnector
  });

  // If the user is currently connected through the Safe connector, the txHash will only
  // be populated after we get it from the Safe wallet contract event, if they're connected
  // to any other connector, the txHash will be the one we get from the mutation
  const txHash = useMemo(
    () => (isSafeConnector ? eventHash : mutationHash),
    [eventHash, mutationHash, isSafeConnector]
  );

  // Monitor tx
  const {
    isLoading: isMining,
    isSuccess,
    error: miningError,
    failureReason
  } = useWaitForTransactionReceipt({
    hash: txHash
  });
  const txReverted = isRevertedError(failureReason);

  useEffect(() => {
    if (txHash) {
      if (isSuccess) {
        onSuccess(txHash);
      } else if (miningError) {
        onError(miningError, txHash);
      } else if (failureReason && txReverted) {
        onError(failureReason, txHash);
      }
    }
  }, [isSuccess, miningError, failureReason, txHash, txReverted]);

  useEffect(() => {
    if (writeError) console.log({ writeError });
    if (miningError) console.log({ miningError });
    if (simulationError) console.log({ simulationError });
  }, [writeError, miningError, simulationError]);

  return {
    execute: () => {
      if (simulationData?.request) {
        writeContract(simulationData.request);
      }
    },
    data: txHash,
    isLoading: isSimulationLoading || (isMining && !txReverted),
    error: writeError || miningError,
    prepareError: simulationError,
    prepared: !!simulationData?.request,
    retryPrepare: refetch
  };
}
