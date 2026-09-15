function createMenuStore(): { open: boolean } {
	let open = $state(false);

	return {
		get open() {
			return open;
		},
		set open(value: boolean) {
			open = value;
		},
	};
}

const menuStore = createMenuStore();

export default menuStore;
