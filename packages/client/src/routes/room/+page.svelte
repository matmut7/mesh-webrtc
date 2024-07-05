<script lang="ts">
	import { onMount } from "svelte";
	import Peer from "../../components/Peer.svelte";
	import SimplePeer from "simple-peer";
	import { PUBLIC_WS_SERVER_URL } from "$env/static/public";

	type peerId = number;

	interface Peer {
		id: peerId;
		simplePeer: SimplePeer.Instance;
		stream: MediaStream | undefined;
	}

	enum SignallingStep {
		Init = 0,
		SignalData
	}

	interface SignallingMessage {
		from: peerId;
		to: peerId;
		step: SignallingStep;
		body: any;
	}

	let peers: Record<peerId, Peer> = {};
	const myId = Math.floor(Math.random() * 100000);

	let localStream: MediaStream;
	let ws: WebSocket;

	let roomContainer: HTMLDivElement;
	let size = 0;
	function updateSize() {
		if (roomContainer && roomContainer.parentElement) {
			if (roomContainer.parentElement.clientWidth > roomContainer.parentElement.clientHeight) {
				size = roomContainer.parentElement.clientHeight;
			} else {
				size = roomContainer.parentElement.clientWidth;
			}
		}
	}
	$: gridSize = Math.ceil(Math.sqrt(Object.keys(peers).length + 1));

	function initWebsocket() {
		ws = new WebSocket(PUBLIC_WS_SERVER_URL);
		ws.addEventListener("open", () => {
			console.log("WS opened");
			const message: SignallingMessage = {
				from: myId,
				to: 0,
				step: SignallingStep.Init,
				body: ""
			};
			ws.send(JSON.stringify(message));
		});
		ws.addEventListener("message", (rawMessage) => {
			const receivedMessage: SignallingMessage = JSON.parse(rawMessage.data);

			if (receivedMessage.to !== 0 && receivedMessage.to !== myId) {
				return;
			}

			if (receivedMessage.step === SignallingStep.Init) {
				initPeer(true, receivedMessage.from, localStream);
			} else if (receivedMessage.step === SignallingStep.SignalData) {
				if (!peers[receivedMessage.from]) {
					initPeer(false, receivedMessage.from, localStream);
				}
				peers[receivedMessage.from].simplePeer.signal(receivedMessage.body);
			}
		});
	}

	function initPeer(initiator: boolean, peerId: peerId, stream: MediaStream | undefined) {
		const newPeer = new SimplePeer({
			initiator,
			stream
		});
		peers[peerId] = { id: peerId, simplePeer: newPeer, stream: undefined };
		newPeer.on("signal", (data) => {
			const signalMessage: SignallingMessage = {
				from: myId,
				to: peerId,
				step: SignallingStep.SignalData,
				body: data
			};
			ws.send(JSON.stringify(signalMessage));
		});
		newPeer.on("connect", () => {
			console.log("connected", peerId);
		});
		newPeer.on("stream", (stream) => {
			peers[peerId].stream = stream;
		});
		newPeer.on("error", (error) => {
			console.log("error", error);
		});
		newPeer.on("close", () => {
			console.log("closed", peerId);
			delete peers[peerId];
			peers = peers;
		});
	}

	onMount(() => {
		(async () => {
			const resizeObserver = new ResizeObserver(updateSize);
			if (roomContainer && roomContainer.parentElement) {
				resizeObserver.observe(roomContainer.parentElement);
			}

			console.log("peerId", myId);

			localStream = await navigator.mediaDevices.getUserMedia({ video: true });

			initWebsocket();

			return () => {
				resizeObserver.disconnect();
				ws.close();
			};
		})();
	});
</script>

<main>
	<div bind:this={roomContainer} id="room-container" style="width: {size}px; height: {size}px;">
		<div style="width: {size / gridSize}px; height: {size / gridSize}px">
			<Peer mirrorVideo={true} mediaStream={localStream} />
		</div>
		{#each Object.values(peers) as peer}
			<div style="width: {size / gridSize}px; height: {size / gridSize}px">
				<Peer mediaStream={peer.stream} />
			</div>
		{/each}
	</div>
</main>

<style>
	main {
		width: 95vw;
		height: 95vh;
		overflow: hidden;
		margin: auto;
		display: flex;
		align-content: center;
		align-items: center;
	}

	#room-container {
		margin: auto;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		align-content: center;
		justify-content: center;
	}
</style>
