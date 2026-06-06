import type { GameState } from "@discord-random-defense/game";

export type CoinInterestResult = {
  baseCoins: number;
  interest: number;
  rate: number;
  capped: boolean;
};

const COIN_INTEREST_RATE = 0.08;
const COIN_INTEREST_MINIMUM_BALANCE = 30;
const COIN_INTEREST_MAX_REWARD = 30;

export function calculateCoinInterest(state: GameState): CoinInterestResult {
  const baseCoins = Math.max(0, state.resources);
  if (baseCoins < COIN_INTEREST_MINIMUM_BALANCE) {
    return {
      baseCoins,
      interest: 0,
      rate: COIN_INTEREST_RATE,
      capped: false,
    };
  }

  const rawInterest = Math.floor(baseCoins * COIN_INTEREST_RATE);
  const interest = Math.min(COIN_INTEREST_MAX_REWARD, rawInterest);

  return {
    baseCoins,
    interest,
    rate: COIN_INTEREST_RATE,
    capped: rawInterest > COIN_INTEREST_MAX_REWARD,
  };
}

export function applyCoinInterest(state: GameState): { state: GameState; result: CoinInterestResult } {
  const result = calculateCoinInterest(state);
  if (result.interest <= 0) return { state, result };

  return {
    state: {
      ...state,
      resources: state.resources + result.interest,
      score: state.score + result.interest * 2,
    },
    result,
  };
}

export function formatCoinInterestRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}
