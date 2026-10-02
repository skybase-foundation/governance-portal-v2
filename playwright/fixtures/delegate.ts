import { expect, Page } from '@playwright/test';
import { closeModal } from '../shared';

export class DelegatePage {
  readonly page: Page;

  // Locators
  private sortDropdown: any;
  private highestFirstOption: any;
  private delegateButton: any;
  private approveDelegateButton: any;
  private confirmTransactionButton: any;
  private confirmTransactionText: any;
  private depositText: any;
  private mkrInput: any;
  private depositMkrButton: any;
  private delegatingText: any;
  private congratsText: any;
  private delegatedByYouText: any;
  private undelegateButton: any;
  private withdrawText: any;
  private setMaxButton: any;
  private undelegateMkrButton: any;
  private transactionPendingText: any;
  private transactionSentText: any;

  constructor(page: Page) {
    this.page = page;
    this.initializeLocators();
  }

  private initializeLocators() {
    this.sortDropdown = this.page.locator('[data-reach-listbox-input] [role="button"]');
    this.highestFirstOption = this.page.locator('li[role="option"]:has-text("MKR delegated: highest first")');
    this.delegateButton = this.page.locator('[data-testid="button-delegate"]:enabled');
    this.approveDelegateButton = this.page.locator('button:has-text("Approve Delegate Contract")');
    this.confirmTransactionButton = this.page.locator('button:has-text("Confirm Transaction")');
    this.confirmTransactionText = this.page.locator('text=Confirm Transaction');
    this.depositText = this.page.locator('text=Deposit into delegate contract');
    this.mkrInput = this.page.locator('[data-testid="mkr-input"]');
    this.depositMkrButton = this.page.locator('[data-testid="deposit-mkr-modal-button"]');
    this.delegatingText = this.page.locator('text=You are delegating');
    this.congratsText = this.page.locator('text=Congratulations, you delegated');
    this.delegatedByYouText = this.page.locator('[data-testid="mkr-delegated-by-you"]');
    this.undelegateButton = this.page.locator('[data-testid="button-undelegate"]:enabled');
    this.withdrawText = this.page.locator('text=Withdraw from delegate contract');
    this.setMaxButton = this.page.locator('button[data-testid="mkr-input-set-max"]');
    this.undelegateMkrButton = this.page.locator('button:has-text("Undelegate MKR")');
    this.transactionPendingText = this.page.locator('text=Transaction Pending');
    this.transactionSentText = this.page.locator('text=/You undelegated \\d+ from \\w+$/');
  }

  async goto() {
    await this.page.goto('/delegates');
  }

  async sortByHighestFirst() {
    await this.sortDropdown.click();
    await this.highestFirstOption.click();
  }

  async delegate(amount: string) {
    await this.delegateButton.first().click();
    await this.approveDelegateButton.click();
    await expect(this.confirmTransactionText).toBeVisible();

    await expect(this.depositText).toBeVisible();
    await this.mkrInput.fill(amount);
    await this.depositMkrButton.click();

    await expect(this.delegatingText).toBeVisible();
    await this.confirmTransactionButton.click();
    await expect(this.confirmTransactionText).toBeVisible();
    await expect(this.congratsText).toBeVisible();
    await closeModal(this.page);
  }

  async verifyDelegatedAmount(amount: string) {
    await expect(this.delegatedByYouText.first()).toHaveText(amount);
  }

  async verifyDelegateButtonIsDisabled() {
    await expect(this.delegateButton).toHaveCount(0);
  }

  async undelegate() {
    await this.undelegateButton.first().click();
    await this.approveDelegateButton.click();
    await expect(this.confirmTransactionText).toBeVisible();
  }

  async undelegateAll() {
    await expect(this.withdrawText).toBeVisible();
    await this.setMaxButton.click();
    await this.undelegateMkrButton.click();
    await expect(this.transactionPendingText).toBeVisible();
    await expect(this.transactionSentText).toBeVisible();
  }
}
