/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { useState, useEffect } from 'react';
import { Text, Flex, Box, Button, Divider, Card } from 'theme-ui';
import Skeleton from 'modules/app/components/SkeletonThemed';
import { formatDateWithoutTime } from 'lib/datetime';
import { getSkyStatusText } from 'modules/executive/helpers/getStatusText';
import { InternalLink } from 'modules/app/components/InternalLink';
import { SkyProposal } from 'modules/executive/types';
import { CardHeader } from 'modules/app/components/Card/CardHeader';
import { CardTitle } from 'modules/app/components/Card/CardTitle';
import { CardSummary } from 'modules/app/components/Card/CardSummary';
import { ZERO_ADDRESS } from 'modules/web3/constants/addresses';
import { StatBox } from 'modules/app/components/StatBox';
import { StatusText } from 'modules/app/components/StatusText';
import { parseEther } from 'viem';

type Props = {
  proposal: SkyProposal;
  isHat: boolean;
  skyOnHat?: bigint;
};

export default function SkyExecutiveOverviewCard({ proposal, isHat, skyOnHat }: Props): JSX.Element {
  const [postedDateString, setPostedDateString] = useState('');

  useEffect(() => {
    setPostedDateString(`posted ${formatDateWithoutTime(proposal.date)}`);
  }, []);

  // The executive list API returns skySupport in SKY, getSkyStatusText expects wei like skyOnHat
  const spellDataInWei = !proposal.spellData?.skySupport
    ? proposal.spellData
    : {
        ...proposal.spellData,
        skySupport: parseEther(proposal.spellData.skySupport.toString()).toString()
      };

  return (
    <Card
      data-testid="sky-executive-overview-card"
      sx={{
        p: [0, 0],
        width: '100%',
        position: 'relative'
      }}
    >
      <Flex
        sx={{
          flexDirection: 'column',
          px: [3, 4],
          py: [3, proposal.spellData?.hasBeenScheduled ? 3 : 4],
          justifyContent: 'space-between'
        }}
      >
        <Flex sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Flex sx={{ flexDirection: 'column' }}>
              <InternalLink
                href={`/sky-executive/${proposal.key}`}
                title="View executive details"
              >
                <>
                  <CardHeader text={postedDateString} />
                  <CardTitle title={proposal.title} styles={{ mt: 2 }} />
                  <CardSummary text={proposal.proposalBlurb} styles={{ my: 2 }} />
                </>
              </InternalLink>
              <Flex sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                {isHat && proposal.address !== ZERO_ADDRESS ? (
                  // TODO this should be made the primary badge component in our theme
                  <Box
                    sx={{
                      borderRadius: '12px',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'tagColorThree',
                      backgroundColor: 'tagColorThreeBg',
                      my: 2
                    }}
                  >
                    <Text sx={{ fontSize: 2 }}>Governing Proposal</Text>
                  </Box>
                ) : null}
              </Flex>
            </Flex>
          </Box>
        </Flex>

        <Flex sx={{ flexDirection: 'column' }}>
          <Flex
            sx={{
              alignItems: ['flex-end', 'center'],
              justifyContent: 'space-between',
              height: ['auto', 'auto', 'auto', 74]
            }}
          >
            <Flex
              sx={{
                flexDirection: ['column-reverse', 'row'],
                flexWrap: 'wrap-reverse',
                width: 'auto',
                gap: [0, 3]
              }}
            >
              <InternalLink
                href={`/sky-executive/${proposal.key}`}
                title="View executive details"
              >
                <Button
                  variant="outline"
                  sx={{
                    width: 122,
                    mt: [2, 0]
                  }}
                >
                  View Details
                </Button>
              </InternalLink>
            </Flex>
            <Flex sx={{ flexShrink: 0 }}>
              {proposal.spellData?.skySupport === undefined ? (
                <Box sx={{ width: 6, ml: 'auto', height: '100%' }}>
                  <Skeleton />
                </Box>
              ) : (
                <StatBox
                  value={
                    proposal.spellData?.skySupport
                      ? Math.floor(parseFloat(proposal.spellData.skySupport)).toLocaleString()
                      : undefined
                  }
                  label="SKY Supporting"
                  styles={{ textAlign: 'right' }}
                />
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <Flex sx={{ flexDirection: 'column' }}>
        <Divider my={0} />
        <Flex sx={{ py: 2, justifyContent: 'center' }}>
          <StatusText testId="proposal-status">
            {getSkyStatusText({ spellData: spellDataInWei, skyOnHat })}
          </StatusText>
        </Flex>
      </Flex>
    </Card>
  );
}
