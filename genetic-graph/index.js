var genetic = Genetic.create()

// aim for highest fitness possible
genetic.optimize = Genetic.Optimize.Maximize

// function that creates an individual
genetic.seed = function () {
	// 2 coord numbers per vertice
	const entityLength = this.userData.params.bitSize * (this.userData.params.vertices * 2)
	let res = ''
	while (res.length < entityLength) {
		res += Math.random()
			.toString('2')
			.slice(2, 2 + entityLength - res.length)
	}
	return res
}

// random bit mutation
function randomBitMutate(entity) {
	let i = Math.floor(Math.random() * (entity.length - 1))

	let replace = entity.charAt(i) == '1' ? '0' : '1'
	let res = entity.slice(0, i) + replace + entity.slice(i + 1)
	return res
}

// random position mutation - randomizes x and y of a random node
function randomPosMutate(entity) {
	const { bitSize, vertices, connections } = this.userData.params
	const { decodeCoords, intersects } = this.userData.helpers

	const posLength = bitSize * 2
	let newPos = ''
	while (newPos.length < posLength) {
		newPos += Math.random()
			.toString('2')
			.slice(2, 2 + posLength - newPos.length)
	}

	let vertexI = Math.floor(Math.random() * (vertices - 1))
	let realI = vertexI * posLength

	return entity.slice(0, realI) + newPos + entity.slice(realI + posLength)
}

// two-point crossover
function twoPointCrossover(mother, father) {
	// selects 2 random indexes, ca<cb
	var len = mother.length
	var lowerIndex = Math.floor(Math.random() * len)
	var upperIndex = Math.floor(Math.random() * len)
	if (lowerIndex > upperIndex) {
		var tmp = upperIndex
		upperIndex = lowerIndex
		lowerIndex = tmp
	}

	// creates children from substrings of parents
	var son = father.substr(0, lowerIndex) + mother.substr(lowerIndex, upperIndex - lowerIndex) + father.substr(upperIndex)
	var daughter = mother.substr(0, lowerIndex) + father.substr(lowerIndex, upperIndex - lowerIndex) + mother.substr(upperIndex)

	return [son, daughter]
}

// k-point crossover - k is placed at the end of each coordinate set
function kPointCrossover(mother, father) {
	const { bitSize, vertices, connections } = this.userData.params
	const posLength = bitSize * 2

	var son = ''
	var daughter = ''

	for (let vertexI = 0; vertexI < vertices; vertexI++) {
		let i = vertexI * posLength

		// create children fmfmfmf and mfmfmfm
		if (i % 2) {
			son += father.slice(i, i + posLength)
			daughter += mother.slice(i, i + posLength)
		} else {
			son += mother.slice(i, i + posLength)
			daughter += father.slice(i, i + posLength)
		}
	}

	if (son.length != daughter.length || father.length != son.length) {
		console.log('parents:')
		console.log(father, father.length)
		console.log(mother, mother.length)
		console.log('childen:')
		console.log(son, son.length)
		console.log(daughter, daughter.length)
		throw 'k-point crossover error'
	}

	return [son, daughter]
}

// function used to determine a fitness score for an individual
genetic.fitness = function (entity) {
	const { bitSize, vertices, connections } = this.userData.params
	const { decodeCoords, intersects } = this.userData.helpers

	var fitness = 0
	const coords = decodeCoords(entity, bitSize)
	const connectionArr = connections.map((conn) => conn.map((c) => coords[c - 1]))

	// discard specimens where vertices are on top of each other
	for (let i = 0; i < coords.length; i++) {
		for (let j = i + 1; j < coords.length; j++) {
			if (coords[i].x == coords[j].x && coords[i].y == coords[j].y) return -Infinity
		}
	}

	// -1 fitness for each intersecting pair of lines
	for (let i = 0; i < connectionArr.length; i++) {
		for (let j = i + 1; j < connectionArr.length; j++) {
			let [a, b] = connectionArr[i]
			let [c, d] = connectionArr[j]
			if (intersects(a, b, c, d)) fitness--
		}
	}

	coords

	return fitness
}

// function called for each generation. returning false, means that the goal was reached and the algorithm should stop
genetic.generation = function (pop, gIndex, stats) {
	// 0 intersections
	if (pop[0].fitness === 0) return false

	// 5 generations with unchanged fitness
	if (pop[0].fitness === this.prevFitness) this.noChangeStreak += 1
	else this.noChangeStreak = 0
	if (this.noChangeStreak >= this.userData.stop) return false
	this.prevFitness = pop[0].fitness

	return true
}

// function called after set amount of generations, can be used to track calculation progress
// here it creates a row and appends it to the html table
genetic.notification = function (pop, generation, stats, isFinished) {
	var currentValue = pop[0].entity
	this.lastValue = this.lastValue || currentValue
	// if (pop != 0 && currentValue == this.lastValue) return

	let element = $('<td style="overflow-wrap: break-word; max-width:200px;"></td>')

	for (let i in currentValue) {
		let style = currentValue[i] == this.lastValue[i] ? 'background: transparent;' : 'background: #2196F3; color: #fff;'
		element.append(`<span style="${style}">${currentValue[i]}</span>`)
	}

	const { bitSize, vertices, connections } = this.userData.params
	const { decodeCoords, intersects } = this.userData.helpers

	const coords = decodeCoords(currentValue, bitSize)
	const connectionArr = connections.map((conn) => conn.map((c) => coords[c - 1]))

	const maxVal = Math.max(...coords.map((v) => (v.x > v.y ? v.x : v.y)))
	const areaSize = 500
	const offset = 10
	const nodeRadius = 10
	const step = (areaSize - offset * 2) / maxVal
	const scaleCoord = (c) => offset + c * step

	const canvas = document.createElement('canvas')
	canvas.style = 'border: 1px solid black'
	canvas.width = areaSize
	canvas.height = areaSize
	let ctx = canvas.getContext('2d')

	// check which connections are intersecting
	const isConIntersecting = new Array(connectionArr.length).fill(false)
	for (let i = 0; i < connectionArr.length; i++) {
		for (let j = i + 1; j < connectionArr.length; j++) {
			let [a, b] = connectionArr[i]
			let [c, d] = connectionArr[j]
			if (intersects(a, b, c, d)) {
				isConIntersecting[i] = true
				isConIntersecting[j] = true
			}
		}
	}

	for (let [i, [v1, v2]] of connectionArr.entries()) {
		ctx.beginPath()
		ctx.moveTo(scaleCoord(v1.x), scaleCoord(v1.y))
		ctx.lineTo(scaleCoord(v2.x), scaleCoord(v2.y))
		ctx.strokeStyle = isConIntersecting[i] ? 'rgba(255, 0, 0, 255)' : 'rgba(0, 0, 0, 255)'
		ctx.stroke()
	}

	ctx.fillStyle = 'rgba(0, 0, 0, 255)'
	ctx.strokeStyle = 'rgba(255, 255, 255, 255)'
	for (let [i, vertex] of coords.entries()) {
		ctx.beginPath()
		ctx.arc(scaleCoord(vertex.x), scaleCoord(vertex.y), nodeRadius, 0, 2 * Math.PI)
		ctx.fill()
		ctx.strokeText(`${i + 1}`, scaleCoord(vertex.x) - nodeRadius / 2, scaleCoord(vertex.y) + nodeRadius / 4)
	}

	let tr = $('<tr></tr>')
	tr.append(`<td>${generation}</td>`)
	tr.append(`<td>${pop[0].fitness}</td>`)
	tr.append(element)
	tr.append(
		`<td><div style="max-height:500px;overflow-y:auto;">${coords.map((c, i) => `W(${i + 1})={${c.x}, ${c.y}}`).join('<br/>')}</div></td>`
	)

	const intersectingConnections = []
	for (let [i, c] of connectionArr.entries()) {
		if (!isConIntersecting[i]) continue
		intersectingConnections.push(`Connection W${connections[i][0]}(${c[0].x}, ${c[0].y}) with W${connections[i][1]}(${c[1].x}, ${c[1].y})`)
	}
	tr.append(`<td><div style="max-height:500px;overflow-y:auto;">${intersectingConnections.join('<br/>')}</div></td>`)
	let td = $('<td></td>')
	td.append(canvas)
	tr.append(td)
	$('#results tbody').prepend(tr)

	this.lastValue = currentValue
}

function decodeCoords(str, bitSize) {
	let decoded = []
	for (let i = 0; i <= str.length - bitSize * 2; i += bitSize * 2) {
		let x = parseInt(str.slice(i, i + bitSize), 2)
		let y = parseInt(str.slice(i + bitSize, i + bitSize * 2), 2)
		decoded.push({ x, y })
	}
	return decoded
}

// Return true if line segments AB and CD intersect
function intersects(A, B, C, D) {
	function ccw(A, B, C) {
		return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
	}

	// common start or end point
	if (A == C || A == D || B == C || B == D) return false

	return ccw(A, C, D) != ccw(B, C, D) && ccw(A, B, C) != ccw(A, B, D)
}

// jquery document.ready - binds listeners to ui
$(() => {
	$('#solve').on('click', () => {
		$('#results tbody').html('')

		const config = {
			iterations: parseFloat($('#iterations').val()),
			size: parseFloat($('#size').val()),
			crossover: parseFloat($('#crossover').val()),
			mutation: parseFloat($('#mutation').val()),
			skip: parseFloat($('#skip').val()),
		}

		let rawConnections = $('#connections').val().split(/\s+/)
		let connections = []
		while (rawConnections.length > 0) {
			let x1 = parseInt(rawConnections.shift())
			let x2 = parseInt(rawConnections.shift())
			connections.push([x1, x2])
		}

		const params = {
			vertices: parseInt($('#vertices').val()),
			bitSize: parseInt($('#bitSize').val()),
			connections,
		}

		const stop = parseFloat($('#stop').val())

		switch ($('#crossoverFunc').val()) {
			case '2point':
				genetic.crossover = twoPointCrossover
				break
			case 'kPoint':
				genetic.crossover = kPointCrossover
				break
		}
		switch ($('#mutationFunc').val()) {
			case 'randomBit':
				genetic.mutate = randomBitMutate
				break
			case 'position':
				genetic.mutate = randomPosMutate
				break
		}

		switch ($('#select1').val()) {
			case 'tournament2':
				genetic.select1 = Genetic.Select1.Tournament2
				break
			case 'tournament3':
				genetic.select1 = Genetic.Select1.Tournament3
				break
			case 'fittest':
				genetic.select1 = Genetic.Select1.Fittest
				break
			case 'random':
				genetic.select1 = Genetic.Select1.Random
				break
			case 'randomlin':
				genetic.select1 = Genetic.Select1.RandomLinearRank
				break
			case 'sequential':
				genetic.select1 = Genetic.Select1.Sequential
				break
		}

		switch ($('#select2').val()) {
			case 'tournament2':
				genetic.select2 = Genetic.Select2.Tournament2
				break
			case 'tournament3':
				genetic.select2 = Genetic.Select2.Tournament3
				break
			case 'random':
				genetic.select2 = Genetic.Select2.Random
				break
			case 'randomlin':
				genetic.select2 = Genetic.Select2.RandomLinearRank
				break
			case 'sequential':
				genetic.select2 = Genetic.Select2.Sequential
				break
			case 'fittestrandom':
				genetic.select2 = Genetic.Select2.FittestRandom
				break
		}

		// selects a single individual for survival from a population (evolutionary algorithm)

		// also selects two individuals from a population for mating/crossover (makes algorith genetic)
		genetic.select2 = Genetic.Select2.Tournament2

		console.log('starting algorithm')
		genetic.evolve(config, { params: params, stop, helpers: { decodeCoords, intersects } })
	})
})

function fileLoadHandler() {
	var file = document.getElementById('fileInput').files[0]
	if (file) {
		var reader = new FileReader()
		reader.readAsText(file, 'UTF-8')
		reader.onload = function (evt) {
			parseFile(evt.target.result)
		}
		reader.onerror = function (evt) {
			window.alert('File loading error')
		}
	}
}

function parseFile(text) {
	let [firstLine, secondLine, ...rest] = text.split(/\r?\n/)
	$('#vertices').val(parseInt(firstLine))
	$('#connections').val(secondLine)
}
