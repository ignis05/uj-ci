var genetic = Genetic.create()

// aim for highest fitness possible
genetic.optimize = Genetic.Optimize.Maximize
// Tournament2 - selection method, selects 2 random individuals and then chooses one of them that is fitter
// selects a single individual for survival from a population (evolutionary algorithm)
genetic.select1 = Genetic.Select1.Tournament2
// also selects two individuals from a population for mating/crossover (makes algorith genetic)
genetic.select2 = Genetic.Select2.Tournament2

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

// function called when an individual has been selected for mutation
genetic.mutate = function (entity) {
	let i = Math.floor(Math.random() * (entity.length - 1))

	let replace = entity.charAt(i) == '1' ? '0' : '1'
	let res = entity.slice(0, i) + replace + entity.slice(i + 1)
	return res
}

// function called when two individuals are selected for mating
genetic.crossover = function (mother, father) {
	// two-point crossover

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

	// console.log(`${father.length},${mother.length} -> ${son.length},${daughter.length}`)
	return [son, daughter]
}

// function used to determine a fitness score for an individual
genetic.fitness = function (entity) {
	if (!entity) console.log(entity)

	const { bitSize, vertices, connections } = this.userData.params
	const { decodeCoords, intersects } = this.userData.helpers

	var fitness = 0

	let coords = decodeCoords(entity, bitSize)

	let connectionArr = connections.map((conn) => conn.map((c) => coords[c - 1]))

	for (let connection1 of connectionArr) {
		for (let connection2 of connectionArr) {
			if (connection1 == connection2) continue
			let [a, b] = connection1
			let [c, d] = connection2
			if (intersects(a, b, c, d)) fitness--
		}
	}

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

	let element = $('<td></td>')

	for (let i in currentValue) {
		let style = currentValue[i] == this.lastValue[i] ? 'background: transparent;' : 'background: #2196F3; color: #fff;'
		element.append(`<span style="${style}">${currentValue[i]}</span>`)
	}

	const { bitSize, vertices, connections } = this.userData.params
	const { decodeCoords, intersects } = this.userData.helpers

	let coords = decodeCoords(currentValue, bitSize)
	let connectionArr = connections.map((conn) => conn.map((c) => coords[c - 1]))

	let maxVal = Math.max(...coords.map((v) => (v.x > v.y ? v.x : v.y)))

	const width = maxVal * 11
	const height = maxVal * 11
	const offset = maxVal / 2
	const nodeRadius = 10
	const scaleCoord = (c) => offset + c * 10
	let canvas = document.createElement('canvas')
	// canvas.style = 'border: 1px solid black'
	canvas.width = width
	canvas.height = height
	let ctx = canvas.getContext('2d')

	ctx.strokeStyle = 'rgba(0, 0, 0, 255)'
	for (let [v1, v2] of connectionArr) {
		ctx.beginPath()
		ctx.moveTo(scaleCoord(v1.x), scaleCoord(v1.y))
		ctx.lineTo(scaleCoord(v2.x), scaleCoord(v2.y))
		ctx.stroke()
	}

	ctx.fillStyle = 'rgba(0, 0, 0, 255)'
	ctx.strokeStyle = 'rgba(255, 255, 255, 255)'
	for (let [i, vertex] of coords.entries()) {
		ctx.beginPath()
		ctx.arc(scaleCoord(vertex.x), scaleCoord(vertex.y), nodeRadius, 0, 2 * Math.PI)
		ctx.fill()
		ctx.strokeText(`${i + 1}`, scaleCoord(vertex.x) - nodeRadius / 4, scaleCoord(vertex.y))
	}

	let tr = $('<tr></tr>')
	tr.append(`<td>${generation}</td>`)
	tr.append(`<td>${pop[0].fitness?.toPrecision(5)}</td>`)
	tr.append(element)
	tr.append(`<td>${JSON.stringify(coords)}</td>`)
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
