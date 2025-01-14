const { getAPI, addTokenBalance } = require('../helper/acala/interlay-api');

async function tvl() {
  const chain = "interlay";
  const api = await getAPI(chain);
  const balances = {};
  const pools = (await api.query.dexGeneral.pairStatuses.keys()).slice(0, 20);
  const promises = []
  for (const pool of pools) {
    const tokenPair = pool.__internal__args[0]
    // const tokenPair = pool.toHuman()
    const [token0, token1] = tokenPair;
    const info = await api.query.dexGeneral.pairStatuses(tokenPair)
    const pairAccount = info.toJSON().trading?.pairAccount;
    if (pairAccount === undefined) {
      // not active, skip
      continue;
    }

    const [amount0, amount1] = await Promise.all([
      api.query.tokens.accounts(pairAccount, token0),
      api.query.tokens.accounts(pairAccount, token1)
    ]);

    promises.push(addTokenBalance({ balances, chain, atomicAmount: amount0, ccyArg: token0, }))
    promises.push(addTokenBalance({ balances, chain, atomicAmount: amount1, ccyArg: token1, }))
  }
  await Promise.all(promises)

  return balances;
}


module.exports = {
  timetravel: false,
  methodology: "Tracks TVL on Interlay's DEX.",
  interlay: { tvl }
};


