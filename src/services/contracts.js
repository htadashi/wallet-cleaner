import { ethers } from "ethers";
import { Fraction, Percent, JSBI } from "@uniswap/sdk";
const Moralis = require("moralis/node");

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Constants
const CONTRACT_ADDRESSES = require("./adresses");
const ONE = JSBI.BigInt(1);
const CHAIN_ID = {
  1: "eth",
  56: "bsc",
};
const CURRENCY_CHAIN_ID = {
  1: "ETH",
  56: "BNB",
};

async function getAllERC20Balances(address, chainId) {  
  const options = { chain: CHAIN_ID[chainId], address: address };  
  console.log(options);
  Moralis.initialize(process.env.REACT_APP_MORALIS_APP_ID);
  Moralis.serverURL = process.env.REACT_APP_MORALIS_SERVER_URL;
  const balances = await Moralis.Web3.getAllERC20(options);
  return balances;
}

async function getAvailableTokens(chainId, ERC20balance, slippage, provider) {
  const availableTokens = [];
  for (let token of ERC20balance) {
    const balance = ethers.utils.formatUnits(token.balance, token.decimals);
    if ("tokenAddress" in token) {
      /* Get price at Uniswap according to user-defined slippage tolerance */
      try {
        const amountOutMin = await getAmountOutMin(
          chainId,
          token,
          slippage,
          provider
        );
        const formattedAmountOutMin = ethers.utils.formatUnits(
          String(amountOutMin)
        );
        availableTokens.push({
          value: token.tokenAddress,
          label: `${balance} ${token.name} (${formattedAmountOutMin} ${CURRENCY_CHAIN_ID[chainId]})`,
        });
      } catch (error) {
        console.log(error);
      }
    }
  }
  return availableTokens;
}

async function getAmountOutMin(chainId, token, slippage, provider) {
  let routerAddress, wrappedCurrencyAddress;
  switch (chainId) {
    case 1 /* Uniswap */:
      routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
      wrappedCurrencyAddress =
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; /* WETH */
      break;
    case 56 /* Pancakeswap */:
      routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
      wrappedCurrencyAddress =
        "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"; /* WBNB */
      break;
    default:
      console.log("Unrecognized chain id");
      break;
  }
  const router = new ethers.Contract(
    routerAddress,
    [
      "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
      "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    ],
    provider
  );

  try {
    const amountsOut = await router.getAmountsOut(token.balance, [
      token.tokenAddress,
      wrappedCurrencyAddress,
    ]);
    console.log(`amountsOut: ${amountsOut[1]}`);
    const outputAmount = JSBI.BigInt(amountsOut[1]);
    const slippageTolerance = new Percent(slippage, "10000");
    const slippageAdjustedAmountOut = new Fraction(ONE)
      .add(slippageTolerance)
      .invert()
      .multiply(outputAmount).quotient;
    console.log(slippageAdjustedAmountOut);
    return slippageAdjustedAmountOut;
  } catch (error) {
    console.log(error);
  }
}

function checkIfJSONcontains_(json, value) {
  let contains = false;
  Object.keys(json).some((key) => {
    contains =
      typeof json[key] === "object"
        ? checkIfJSONcontains_(json[key], value)
        : json[key] === value;
    return contains;
  });
  return contains;
}

async function generateApproveTransactionsParams(
  address,
  ERC20balance,
  chosenOptions  
) {
  const transactionsParams = [];
  const iface = new ethers.utils.Interface(
    ["function approve(address spender, uint256 amount)"]
  );
  for (const token of ERC20balance) {
    if (checkIfJSONcontains_(chosenOptions, token.tokenAddress)) {

      transactionsParams.push(
        {
          from: address,
          to: token.tokenAddress,
          data: iface.encodeFunctionData("approve", [CONTRACT_ADDRESSES.BATCHSWAP_ADDRESS, token.balance])
        }
      );         
    }
  }  
  return transactionsParams; 
}

// @TODO: Fix contract to estimate gas correctly
async function estimateProfit(
  chainId,
  ERC20balance,
  chosenOptions,
  slippage,
  provider
) {
  let earnings = 0;
  //let gasPrice = 0;

  const addresses = [];
  const amountsIn = [];
  const amountsOut = [];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; //@TODO: Change to user-defined

  // Calculate earnings and estimate gas price
  for (const token of ERC20balance) {
    if (checkIfJSONcontains_(chosenOptions, token.tokenAddress)) {
      const amountOutMin = await getAmountOutMin(
        chainId,
        token,
        slippage,
        provider
      );

      // Append values to contract parameters
      console.log(JSBI.toNumber(amountOutMin));
      amountsIn.push(token.balance);
      addresses.push(token.tokenAddress);
      amountsOut.push(JSBI.toNumber(amountOutMin).toString());

      // Add to earning in ETH
      earnings += JSBI.toNumber(amountOutMin);
    }
  }
  earnings = ethers.utils.formatUnits(earnings.toString(), 18);

  // Call contract
  // const signer = provider.getSigner();
  // const batchSwapContract = new ethers.Contract(
  //   CONTRACT_ADDRESSES.BATCHSWAP_ADDRESS,
  //   [
  //     "function batchSwap(address[] memory tokensAddresses, uint256[] memory amountIn, uint256[] memory amountOutMin, uint256 deadline) public",
  //   ],
  //   signer
  // );
  // Estimate gas @TODO
  try{
    console.log(JSON.stringify(addresses));
    console.log(JSON.stringify(amountsIn));
    console.log(JSON.stringify(amountsOut));
    console.log(deadline.toString());
    // const gasEstimate = await batchSwapContract.estimateGas.batchSwap(
    //   addresses,
    //   amountsIn,
    //   amountsOut,
    //   deadline
    // );
    // console.log(gasEstimate);
  }catch(error){
    console.log(error);
  }

  return [earnings, 0];
}

export { getAllERC20Balances, getAvailableTokens, estimateProfit, generateApproveTransactionsParams };
