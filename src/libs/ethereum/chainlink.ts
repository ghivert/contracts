import { ethers } from 'ethers'
import { polygon, kovan } from './provider'
import aggregABI from '@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json'

const isStaging = !!process.env.REACT_APP_STAGING_MATIC_USD

const polygonMatUsd =
  process.env.REACT_APP_STAGING_MATIC_USD ??
  process.env.REACT_APP_PROD_MATIC_USD ??
  ''
const polygonEurUsd =
  process.env.REACT_APP_STAGING_EUR_USD ??
  process.env.REACT_APP_PROD_EUR_USD ??
  ''

const provider = isStaging ? kovan : polygon

const priceMatUsdFeed = new ethers.Contract(polygonMatUsd, aggregABI, provider)
const priceEurUsdFeed = new ethers.Contract(polygonEurUsd, aggregABI, provider)

/** Get the price from cents (500 for 5.00 €) in Wei */
export const getPrice = async (value: number) => {
  const decs = 8
  const price = await getDerivedPrice(priceMatUsdFeed, priceEurUsdFeed, decs)
  const precision = 10 ** (decs - 2)
  const priceWithPrecision = value * precision
  return Math.round(fromEthers(priceWithPrecision) / price)
}

/** Convert the value from Eth to Wei */
export const fromEthers = (value: number) => {
  const weiExponential = 10 ** 18
  return value * weiExponential
}

/** Convert the value from Wei to Eth */
export const fromWei = (value: number) => {
  const weiExponential = 10 ** 18
  return value / weiExponential
}

const getDerivedPrice = async (
  ethUsd: ethers.Contract,
  eurUsd: ethers.Contract,
  decimals: number
) => {
  const _decimals = 10 ** decimals
  const basePrice = await getAggregatorPrice(ethUsd, decimals)
  const quotePrice = await getAggregatorPrice(eurUsd, decimals)
  return (basePrice * _decimals) / quotePrice
}

const getAggregatorPrice = async (
  priceFeed: ethers.Contract,
  decimals: number
) => {
  const roundData = await priceFeed.latestRoundData()
  const basePrice = roundData.answer.toNumber()
  const baseDecimals = await priceFeed.decimals()
  return scalePrice(basePrice, baseDecimals, decimals)
}

const scalePrice = (price: number, priceDecimals: number, decimals: number) => {
  if (priceDecimals < decimals) {
    const precision = 10 ** (decimals - priceDecimals)
    return price * precision
  } else if (priceDecimals > decimals) {
    const precision = 10 ** (priceDecimals - decimals)
    return price / precision
  } else {
    return price
  }
}
