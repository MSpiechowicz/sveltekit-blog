function createMenuStore(): { open: boolean; toggle: () => void } {
	let open = $state(false);

	return {
		get open() {
			return open;
		},
		toggle() {
			open = !open;
		}
	};
}

const menuStore = createMenuStore();

export default menuStore;
