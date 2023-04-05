let stackTemplate;

function createStackItem(data) {
	const stack = stackTemplate.cloneNode(true);
	data.element = stack;
	data.element.setAttribute('data-id', data.id);
	stack.addEventListener('click', () => {
		exit_rotlock(data.id);
	});
	updateStackItem(data);

	return stack;
}

function removeStackItem(element) {
	if (element.getAttribute('removing') === 'true') return;
	element.setAttribute('removing', 'true');
	const height = getComputedStyle(element).height;
	element.style.height = height;
	element.addEventListener('transitionend', () => {
		element.remove();
	});
	setTimeout(() => {
		element.style.height = '0px';
	});
}

function updateStackItem(data) {
	if (data.time == 0) {
		removeStackItem(data.element);
	}
	if (data.type === 'READ') {
		for (const element of data.element.querySelectorAll('.range-block')) {
			element.classList.remove('bg-blue-500');
			element.classList.add('bg-red-500');
		}
	}
	if (data.low <= data.high) {
		data.element.querySelector('.range-block').style.left = `${data.low / 360 * 100}%`;
		data.element.querySelector('.range-block').style.right = `${(359 - data.high) / 360 * 100}%`;
	} else {
		const range_blocks = Array.from(data.element.querySelectorAll('.range-block'));
		if (range_blocks.length === 1) {
			const new_range_block = range_blocks[0].cloneNode(true);
			range_blocks[0].parentElement.appendChild(new_range_block);
			range_blocks.push(new_range_block);
		}
		range_blocks[0].style.left = '0%';
		range_blocks[0].style.right = `${(359 - data.high) / 360 * 100}%`;
		range_blocks[1].style.left = `${data.low / 360 * 100}%`;
		range_blocks[1].style.right = '0%';
	}
	data.element.querySelector('.center-label').innerHTML = `${data.type} #${data.id} [${data.low} ~ ${data.high}] | ${data.state} ${Math.floor(data.time * 10) / 10}s`;
	if (data.state == 'EXECUTING') {
		data.element.querySelector('.stack-background').classList.remove('bg-gray-200');
		data.element.querySelector('.stack-background').classList.add('bg-green-200');
	} else {
		data.element.querySelector('.stack-background').classList.remove('bg-green-200');
		data.element.querySelector('.stack-background').classList.add('bg-gray-200');
	}
}

function updatePointer(custom_orientation = null) {
	let pointer_orientation = custom_orientation ?? current_orientation;
	const pointer = document.getElementById('pointer');
	pointer.style.left = `${pointer_orientation / 360 * 100}%`;
	document.getElementById('current-orientation').innerText = pointer_orientation;
}

let lastTime;

function startProgram() {
	lastTime = Date.now();
	updateProgram();
}

function updateProgram() {
	if (playing) {
		const deltaTime = Date.now() - lastTime;
		for (const lock_data of lock_list) {
			if (lock_data == null) continue;
			if (lock_data.state === 'EXECUTING') {
				lock_data.time -= deltaTime / 1000;
				if (lock_data.time <= 0) {
					lock_data.time = 0;
					rotation_unlock(lock_data.id);
				}
				updateStackItem(lock_data);
			}
		}
	}
	Array.from(document.getElementById('stack').children).forEach((element) => {
		if (lock_list[element.getAttribute('data-id')] == null) {
			removeStackItem(element);
		}
	})
	lastTime = Date.now();
	requestAnimationFrame(updateProgram);
}

function startRotation() {
	lastRotateTime = Date.now();
	updateRotation();
}

let lastRotateTime;
let orientation_changing = false;
let requested_orientation = null;
let rotateSpeed = 15;
function updateRotation() {
	if (playing) {
		if (requested_orientation != null) {
			set_orientation(requested_orientation);
			requested_orientation = null;
		}
		if (!orientation_changing) {
			const deltaTime = Date.now() - lastRotateTime;
			if (deltaTime >= 1000 / rotateSpeed) {
				set_orientation((current_orientation + 1) % 360)
				lastRotateTime = Date.now() + deltaTime - 1000 / rotateSpeed;
			}
		} else {
			lastRotateTime = Date.now();
		}
		updatePointer();
	} else {
		lastRotateTime = Date.now();
	}
	requestAnimationFrame(updateRotation);
}

let playing = false;

function init() {
	const stack = document.getElementById('stack');
	while (stack.firstChild) stack.firstChild.remove();
	if (requested_orientation) current_orientation = requested_orientation;
	init_scheduler();
	updatePointer();

	const randomCheckbox = document.getElementById('random-checkbox');

	if (randomCheckbox.checked) {
		for (i = 0; i < 10; ++i) {
			const type = Math.random() > 0.5 ? 'READ' : 'WRITE';
			const range = [Math.floor(Math.random() * 360), Math.floor(Math.random() * 360)];
			const id = rotation_lock(range[0], range[1], type);
			lock_list[id].time = 2;
			lock_list[id].id = id;
			lock_list[id].element = createStackItem(lock_list[id]);
			stack.appendChild(lock_list[id].element);
		}
	} else {
		const rawInput = document.getElementById('testcase').value;
		const lines = rawInput.split('\n');
		for (const line of lines) {
			const [type, low, high] = line.split(' ');
			const id = rotation_lock(parseInt(low), parseInt(high), type);
			lock_list[id].time = 2;
			lock_list[id].id = id;
			lock_list[id].element = createStackItem(lock_list[id]);
			stack.appendChild(lock_list[id].element);
		}
	}

	playing = false;
	orientation_changing = false;
	rotateSpeed = 15;
	document.getElementById('speed-range').value = rotateSpeed;
	document.getElementById('speed-label').innerText = `회전 속도: ${rotateSpeed}°/s`;
	updateStartButton();
	startProgram();
	startRotation();
}

function updateStartButton() {
	const startButton = document.getElementById('start-button');
	if (playing) {
		startButton.classList.remove('bg-blue-500');
		startButton.classList.remove('hover:bg-blue-600');
		startButton.classList.add('bg-red-500');
		startButton.classList.add('hover:bg-red-600');
		startButton.innerText = 'Pause';
	} else {
		startButton.classList.remove('bg-red-500');
		startButton.classList.remove('hover:bg-red-600');
		startButton.classList.add('bg-blue-500');
		startButton.classList.add('hover:bg-blue-600');
		startButton.innerText = 'Start';
	}
}

window.addEventListener('load', () => {
	stackTemplate = document.getElementById('stack-template');
	stackTemplate.id = '';
	stackTemplate.classList.remove('hidden');
	stackTemplate.remove();

	init();

	const startButton = document.getElementById('start-button');
	startButton.addEventListener('click', () => {
		playing = !playing;
		updateStartButton();
	});

	const resetButton = document.getElementById('reset-button');
	resetButton.addEventListener('click', () => {
		init();
	});

	const pointerTip = document.getElementById('pointer-tip');
	const totalWidth = parseInt(getComputedStyle(document.getElementById('bar')).width, 10);
	let startX;
	let startOrientation;
	pointerTip.addEventListener('mousedown', (event) => {
		orientation_changing = true;
		startX = event.screenX;
		startOrientation = requested_orientation ?? current_orientation;
	});

	document.addEventListener('mousemove', (event) => {
		if (orientation_changing) {
			const delta = event.screenX - startX;
			requested_orientation = (Math.floor(startOrientation + delta / totalWidth * 360) % 360 + 360) % 360;
			updatePointer(requested_orientation);
		}
	});

	document.addEventListener('mouseup', (event) => {
		orientation_changing = false;
	});

	const addButton = document.getElementById('add-button');
	const addType = document.getElementById('add-type');
	const addLow = document.getElementById('add-low');
	const addHigh = document.getElementById('add-high');

	addButton.addEventListener('click', () => {
		let type = addType.value;
		let range;
		if (type === 'RANDOM') {
			type = Math.random() > 0.5 ? 'READ' : 'WRITE';
			range = [Math.floor(Math.random() * 360), Math.floor(Math.random() * 360)];
		} else {
			range = [addLow.value, addHigh.value];
		}
		const id = rotation_lock(range[0], range[1], type);
		lock_list[id].time = 2;
		lock_list[id].id = id;
		lock_list[id].element = createStackItem(lock_list[id]);
		document.getElementById('stack').appendChild(lock_list[id].element);
	});

	const randomCheckbox = document.getElementById('random-checkbox');
	const onRandomCheckboxChange = () => {
		const testcase = document.getElementById('testcase');
		testcase.disabled = randomCheckbox.checked;
	};
	randomCheckbox.addEventListener('change', onRandomCheckboxChange);
	onRandomCheckboxChange();

	const speedRange = document.getElementById('speed-range');
	const speedLabel = document.getElementById('speed-label');
	speedRange.addEventListener('input', () => {
		rotateSpeed = speedRange.value;
		speedLabel.innerText = `회전 속도: ${rotateSpeed}°/s`;
	});
});