import 'dotenv/config'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import * as hre from 'hardhat'
import type { Booking } from '$/Booking'
import type { Event } from 'ethers'
import * as ethereum from '../src/libs/ethereum'

const mainnetMatUSD = process.env.REACT_APP_PROD_MATIC_USD
const mainnetEurUsd = process.env.REACT_APP_PROD_EUR_USD

const keepTransferIds = (events: Event[]) => {
  return events
    .filter(({ event }) => event === 'Transfer')
    .flatMap(({ args }) => {
      const id = args?.tokenId?.toNumber()
      return id ? [id] : []
    })
}

describe('Booking', function () {
  let booking: Booking

  before(async function () {
    const Wei = await ethers.getContractFactory('Wei')
    const wei = await Wei.deploy()
    const options = { libraries: { Wei: wei.address } }
    const Booking = await ethers.getContractFactory('Booking', options)
    const contract = await Booking.deploy(mainnetMatUSD, mainnetEurUsd)
    await contract.deployed()
    booking = contract as Booking
  })

  it('Should be able to book a place', async function () {
    const count = 2
    const price = await ethereum.mainnet.chainlink.getPrice(800 * count)
    const value = ethers.BigNumber.from(price.toString())
    const result = await booking.book(count, { value })
    const { events } = await result.wait()
    expect(events).length.greaterThan(0)
    expect(keepTransferIds(events!)).to.eql([1, 2])
  })

  it('Should correctly handles tokenURI', async function () {
    const tokens = [1, 2]
    for (const token of tokens) {
      const uri = await booking.tokenURI(token)
      const base = 'https://cryptocomedyclub.co/.netlify/functions/tokenURI/'
      expect(uri).to.eq(`${base}${token}`)
    }
  })

  it('Should be able to withdraw ethers', async function () {
    const { admin } = await hre.getNamedAccounts()
    const bal = await ethers.provider.getBalance(admin)
    const tx = await booking.withdrawal()
    const result = await tx.wait()
    const event = result.events?.find(e => e.event === 'Withdrawed')
    const value = event?.args?.withdrawed
    const aft = await ethers.provider.getBalance(admin)
    expect(value.gt(0)).to.be.true
    expect(aft.gt(bal)).to.be.true
  })
})
