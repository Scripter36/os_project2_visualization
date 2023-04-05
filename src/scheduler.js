let current_orientation = 0;
const state = Array(360).fill(0);
const write_state = Array(360).fill(0);
const lock_list = [];

function init_scheduler () {
	// current_orientation = 0;
	state.fill(0);
	write_state.fill(0);
	lock_list.splice(0, lock_list.length);
}

function get_range(low, high) {
	const range = [];
	if (low <= high) {
		for (let i = low; i <= high; ++i) {
			range.push(i);
		}
	} else {
		for (let i = low; i < 360; ++i) {
			range.push(i);
		}
		for (let i = 0; i <= high; ++i) {
			range.push(i);
		}
	}
	return range;
}

function check_list() {
	write_state.fill(0);
	for (const lock_data of lock_list) {
		if (lock_data == null) continue;
		if (lock_data.type === 'WRITE') {
			if (lock_data.state !== 'EXECUTING' && get_range(lock_data.low, lock_data.high).every((i) => state[i] === 0) && get_range(lock_data.low, lock_data.high).includes(current_orientation)) {
				lock_data.state = 'EXECUTING';
				get_range(lock_data.low, lock_data.high).forEach((i) => {
					state[i] = -1;
				});
			}
			get_range(lock_data.low, lock_data.high).forEach((i) => {
				write_state[i] = 1;
			});
		} else {
			if (lock_data.state !== 'EXECUTING' && get_range(lock_data.low, lock_data.high).every((i) => state[i] !== -1) && get_range(lock_data.low, lock_data.high).includes(current_orientation) && get_range(lock_data.low, lock_data.high).every((i) => write_state[i] === 0)) {
				lock_data.state = 'EXECUTING';
				get_range(lock_data.low, lock_data.high).forEach((i) => {
					state[i] += 1;
				});
			}
		}
	}
}

function set_orientation(degree) {
	current_orientation = degree;
	check_list();
}

function rotation_lock(low, high, type) {
	let new_lock_data = {
		low: low,
		high: high,
		type: type,
		state: 'EXECUTING'
	};
	if (type === 'READ') {
		if (get_range(low, high).some((i) => state[i] === -1) || !get_range(low, high).includes(current_orientation)) {
			new_lock_data.state = 'LOCKED';
		}
		write_state.fill(0);
		for (const lock_data of lock_list) {
			if (lock_data == null) continue;
			if (lock_data.type === 'WRITE') {
				get_range(lock_data.low, lock_data.high).forEach((i) => {
					write_state[i] = 1;
				});
			}
		}
		if (get_range(low, high).some((i) => write_state[i] === 1)) {
			new_lock_data.state = 'LOCKED';
		}
		if (new_lock_data.state === 'EXECUTING') {
			get_range(low, high).forEach((i) => {
				state[i] += 1;
			});
		}
	} else {
		if (get_range(low, high).some((i) => state[i] !== 0) || !get_range(low, high).includes(current_orientation)) {
			new_lock_data.state = 'LOCKED';
		}
		if (new_lock_data.state === 'EXECUTING') {
			get_range(low, high).forEach((i) => {
				state[i] = -1;
			});
		}
	}
	lock_list.push(new_lock_data);
	return lock_list.length - 1;
}

function rotation_unlock(id) {
	if (lock_list[id].state === 'EXECUTING') {
		if (lock_list[id].type === 'READ') {
			get_range(lock_list[id].low, lock_list[id].high).forEach((i) => {
				state[i] -= 1;
			});
		} else {
			get_range(lock_list[id].low, lock_list[id].high).forEach((i) => {
				state[i] = 0;
			});
		}
	}

	lock_list[id] = null;
	check_list();
}

// for convinience, we provide id instead of task_struct
function exit_rotlock(id) {
	rotation_unlock(id);
}