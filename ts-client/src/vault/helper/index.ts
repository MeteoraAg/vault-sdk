import BN from 'bn.js';
import { LOCKED_PROFIT_DEGRADATION_DENOMINATOR, VAULT_VERSION_TRACKED_LP_SUPPLY } from '../constants';
import { VaultState } from '../types';

/**
 *
 * @param share - user's share
 * @param withdrawableAmount - vault's withdrawable amount, vaultImpl.getWithdrawableAmount()
 * @param totalSupply - vault's lp supply, getVaultLpSupply()
 * @returns
 */
export function getAmountByShare(share: BN, withdrawableAmount: BN, totalSupply: BN): BN {
  return totalSupply.isZero() ? new BN(0) : share.mul(withdrawableAmount).div(totalSupply);
}

/**
 *
 * @param amount - amount of desired underlying token to unstake
 * @param withdrawableAmount - vault's withdrawable amount, vaultImpl.getWithdrawableAmount()
 * @param totalSupply - vault's lp supply, getVaultLpSupply()
 * @returns BN
 */
export function getUnmintAmount(amount: BN, withdrawableAmount: BN, totalSupply: BN) {
  return amount.mul(totalSupply).div(withdrawableAmount);
}

/**
 *
 * @param vaultState - VaultState
 * @param lpMintSupply - supply of the vault's lp mint
 * @returns lp supply the vault prices shares with, `totalLpSupply` for version 1 vaults
 */
export function getVaultLpSupply(vaultState: VaultState, lpMintSupply: BN): BN {
  return vaultState.version === VAULT_VERSION_TRACKED_LP_SUPPLY ? vaultState.totalLpSupply : lpMintSupply;
}

/**
 * `calculateWithdrawableAmount` calculates the amount of funds that can be withdrawn from a vault with vault state provided
 * @param {number} onChainTime - the current time on the blockchain
 * @param {VaultState} vaultState - VaultState
 * @returns The amount of the vault that can be withdrawn.
 */
export function calculateWithdrawableAmount(onChainTime: number, vaultState: VaultState) {
  const {
    lockedProfitTracker: { lastReport, lockedProfitDegradation, lastUpdatedLockedProfit },
    totalAmount: vaultTotalAmount,
  } = vaultState;

  const duration = new BN(onChainTime).sub(lastReport);

  const lockedFundRatio = duration.mul(lockedProfitDegradation);
  if (lockedFundRatio.gt(LOCKED_PROFIT_DEGRADATION_DENOMINATOR)) {
    return vaultTotalAmount;
  }

  const lockedProfit = lastUpdatedLockedProfit
    .mul(LOCKED_PROFIT_DEGRADATION_DENOMINATOR.sub(lockedFundRatio))
    .div(LOCKED_PROFIT_DEGRADATION_DENOMINATOR);

  return vaultTotalAmount.sub(lockedProfit);
}
