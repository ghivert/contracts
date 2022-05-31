import 'dotenv/config'
import { HardhatUserConfig, task } from 'hardhat/config'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()
  const network = hre.ethers.providers.getNetwork('mainnet')
  for (const account of accounts) {
    console.log(account.address)
  }
})

const ACCOUNTS = [process.env.PRODUCTION_PRIVATE_KEY!]
const MAINNET_API_KEY = process.env.REACT_APP_POLYGON_KEY
const KOVAN_API_KEY = process.env.REACT_APP_KOVAN_KEY
const polyURL = `https://polygon-mainnet.g.alchemy.com/v2`
const polygon = [polyURL, MAINNET_API_KEY].join('/')
const kovanURL = `https://eth-kovan.alchemyapi.io/v2`
const kovan = [kovanURL, KOVAN_API_KEY].join('/')

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: '0.8.4',
  networks: {
    localhost: { tags: ['local'] },
    hardhat: {
      forking: { url: polygon },
      tags: ['test', 'local'],
    },
    kovan: {
      url: kovan,
      accounts: ACCOUNTS,
      tags: ['staging'],
    },
    polygon: {
      url: polygon,
      accounts: ACCOUNTS,
      tags: ['production'],
    },
  },
  namedAccounts: {
    deployer: { default: 0 },
    admin: { default: 0 },
  },
  etherscan: {
    // @ts-ignore
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY!,
    },
  },
}

export default config
