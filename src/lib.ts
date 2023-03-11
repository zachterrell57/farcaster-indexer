import { Client } from '@farcaster/js'
import * as protobufs from '@farcaster/protobufs'

import {
  insertCast,
  deleteCast,
  insertVerification,
  deleteVerification,
} from './api'
import {
  FormattedHubEvent,
  MergeMessageHubEvent,
  PruneMessageHubEvent,
  RevokeMessageHubEvent,
} from './types'

export const client = new Client('127.0.0.1:13112')

/**
 * Convert a HubEvent (protobufs) to a more readable format (JSON)
 * @param e HubEvent
 * @returns Hub event in JSON format
 */
export function protobufToJson(e: protobufs.HubEvent) {
  let event: FormattedHubEvent = {
    type: e.type,
    message: {},
  }

  if (protobufs.isMergeMessageHubEvent(e)) {
    event.message = protobufs.Message.toJSON(e.mergeMessageBody.message!)
  } else if (protobufs.isPruneMessageHubEvent(e)) {
    event.message = protobufs.Message.toJSON(e.pruneMessageBody.message!)
  } else if (protobufs.isRevokeMessageHubEvent(e)) {
    event.message = protobufs.Message.toJSON(e.revokeMessageBody.message!)
  } else if (protobufs.isMergeIdRegistryEventHubEvent(e)) {
    event.message = protobufs.IdRegistryEvent.toJSON(
      e.mergeIdRegistryEventBody.idRegistryEvent!
    )
  } else if (protobufs.isMergeNameRegistryEventHubEvent(e)) {
    event.message = protobufs.NameRegistryEvent.toJSON(
      e.mergeNameRegistryEventBody.nameRegistryEvent!
    )
  }

  return event
}

/**
 * Update the database based on the event type
 * @param event Hub event in JSON format
 */
export async function handleEvent(event: FormattedHubEvent) {
  // Handle each event type: MERGE_MESSAGE (1), PRUNE_MESSAGE (2), REVOKE_MESSAGE (3), MERGE_ID_REGISTRY_EVENT (4), MERGE_NAME_REGISTRY_EVENT (5)
  if (event.type === 1) {
    const msg = event.message as MergeMessageHubEvent

    if (msg.data.type === 'MESSAGE_TYPE_CAST_ADD') {
      await insertCast(msg)
    } else if (msg.data.type === 'MESSAGE_TYPE_CAST_REMOVE') {
      await deleteCast(msg)
    } else if (msg.data.type === 'MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS') {
      await insertVerification(msg)
    } else if (msg.data.type === 'MESSAGE_TYPE_VERIFICATION_REMOVE') {
      await deleteVerification(msg)
    }
  } else if (event.type === 2) {
    const msg = event.message as PruneMessageHubEvent
    console.log('PRUNE_MESSAGE')
  } else if (event.type === 3) {
    const msg = event.message as RevokeMessageHubEvent
    console.log('REVOKE_MESSAGE')
  } else if (event.type === 4) {
    const msg = event.message as protobufs.IdRegistryEvent
    console.log('MERGE_ID_REGISTRY_EVENT')
  } else if (event.type === 5) {
    const msg = event.message as protobufs.NameRegistryEvent
    console.log('MERGE_NAME_REGISTRY_EVENT')
  } else {
    console.log('UNKNOWN EVENT TYPE')
  }
}

/**
 * Convert a base64 hash to hex string
 * @param hash Base64 hash
 * @returns Hex string
 */
export function formatHash(hash: string) {
  return '0x' + Buffer.from(hash, 'base64').toString('hex')
}
