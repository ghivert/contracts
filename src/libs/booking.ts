import { ethers } from 'ethers'
import * as ethereum from './ethereum'
import BKGAddress from '@/artifacts/BookingAddress.json'
import BKGDetails from '@/artifacts/Booking.json'
import type { Booking } from '$/Booking'
export type { Booking } from '$/Booking'

export const correctChain = () => {
  if (process.env.REACT_APP_STAGING_MATIC_USD) return 42
  if (process.env.NODE_ENV === 'development') return 31337
  return 137
}

export const init = async (details: ethereum.Details) => {
  const { provider, signer } = details
  const network = await provider.getNetwork()
  if (correctChain() !== network.chainId) return null
  const contract = new ethers.Contract(BKGAddress, BKGDetails.abi, provider)
  const deployed = await contract.deployed()
  if (!deployed) return null
  return (signer ? contract.connect(signer) : contract) as Booking
}

export const connect = (details: ethereum.Details, contract: Booking) => {
  if (details.signer) return contract.connect(details.signer)
}

export const places = async (owner: string, contract: Booking) => {
  const balance = await contract.balanceOf(owner).catch(() => null)
  if (balance) {
    const empty = new Array(balance.toNumber()).fill(0)
    return await Promise.all(
      empty.map(async (_, index) => {
        const tokenId = await contract.tokenOfOwnerByIndex(owner, index)
        return tokenId.toNumber()
      })
    )
  }
  return []
}
