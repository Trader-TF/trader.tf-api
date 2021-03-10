import io, { Socket } from 'socket.io-client'

import { TraderTFOptions, Price, Snapshot } from './common'

export type OnPriceListener = (price: Price) => unknown;

export type OnSnapshotListener = (price: Snapshot) => unknown;

export class TraderTFSocket {
	public readonly socket: typeof Socket;

	constructor ({
		pricerInstanceUrl = 'https://trader.tf/',
		apiKey
	}: TraderTFOptions) {
		this.socket = io(pricerInstanceUrl, {
			autoConnect: false,
			forceNew: true,
			/**
             * Authentication happens within the query.
             */
			query: { key: apiKey }
		})
	}

	connect () {
		return new Promise<void>((resolve, reject) => {
			const onConnect = () => {
				this.socket.off('connect_error', onConnectError)
				resolve()
			}
			const onConnectError = (err: Error) => {
				this.socket.off('connect', onConnect)
				reject(err)
			}

			this.socket.once('connect', onConnect)
			this.socket.once('connect_error', onConnectError)

			this.socket.connect()
		})
	}

	onPrice (sku: string|OnPriceListener, listener?: OnPriceListener): void {
		if (typeof sku === 'function') {
			this.socket.on('price', sku)
			return
		}

		if (listener) {
			this.socket.on(`price/${sku}`, listener)
		}
	}

	onSnapshot (sku: string|OnSnapshotListener, listener?: OnSnapshotListener) {
		if (typeof sku === 'function') {
			this.socket.on('snapshot', sku)
			return
		}

		if (listener) {
			this.socket.on(`snapshot/${sku}`, listener)
		}
	}
}
