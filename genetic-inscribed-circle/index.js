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
	// 3 binary numbers, each on the same amount of bits (x,y,r)
	let res = ''
	while (res.length < this.userData.bitSize * 3) {
		res += Math.random()
			.toString('2')
			.slice(2, 2 + this.userData.bitSize * 3 - res.length)
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
	const squareSize = this.userData.squareParams.size
	const xOffset = this.userData.squareParams.x
	const yOffset = this.userData.squareParams.y

	// parse integers from bits
	let { x, y, r } = this.userData.helpers.decodeCoords(entity, this.userData.bitSize)

	if (isNaN(x) || isNaN(y) || isNaN(r)) return -Infinity // if number failed to be converted to a valid int

	// calculate score
	const halfSize = squareSize / 2
	let xPenalty = Math.abs(halfSize + xOffset - (x + r))
	let yPenalty = Math.abs(halfSize + yOffset - (y + r))
	let xPenalty2 = Math.abs(xOffset - halfSize - (x - r))
	let yPenalty2 = Math.abs(yOffset - halfSize - (y - r))
	return r - xPenalty - yPenalty - xPenalty2 - yPenalty2
}

// function called for each generation. returning false, means that the goal was reached and the algorithm should stop
genetic.generation = function (pop, generation, stats) {
	if (this.prevPop && pop[0].entity == this.prevPop[0].entity) this.noChangeStreak += 1
	else this.noChangeStreak = 0

	if (this.noChangeStreak >= this.userData.stop) return false

	this.prevPop = pop
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

	let { x, y, r } = this.userData.helpers.decodeCoords(currentValue, this.userData.bitSize)

	const squareSize = this.userData.squareParams.size / 10
	const offset = squareSize / 2
	const xOffset = this.userData.squareParams.x / 10
	const yOffset = this.userData.squareParams.y / 10
	let canvas = document.createElement('canvas')
	// canvas.style = 'border: 1px solid black'
	canvas.width = squareSize * 2
	canvas.height = squareSize * 2
	let ctx = canvas.getContext('2d')
	ctx.fillStyle = 'rgba(0, 0, 255, 0.5)'
	ctx.beginPath()
	ctx.rect(offset, offset, squareSize, squareSize)
	ctx.fill()
	ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
	ctx.beginPath()
	if (r > 0) ctx.arc(x / 10 + offset * 2 - xOffset, y / 10 + offset * 2 - yOffset, r / 10, 0, 2 * Math.PI)
	ctx.fill()

	let tr = $('<tr></tr>')
	tr.append(`<td>${generation}</td>`)
	tr.append(`<td>${pop[0].fitness?.toPrecision(5)}</td>`)
	tr.append(element)
	tr.append(`<td>x:${x / 1000}, y:${y / 1000}, r:${r / 1000}</td>`)
	let td = $('<td></td>')
	td.append(canvas)
	tr.append(td)
	$('#results tbody').prepend(tr)

	this.lastValue = currentValue
}

function decodeCoords(str, bitSize) {
	let xRaw = str.slice(0, bitSize)
	let yRaw = str.slice(bitSize, bitSize * 2)
	let rRaw = str.slice(bitSize * 2, bitSize * 3)
	let x = (xRaw[0] == '1' ? 1 : -1) * parseInt(xRaw.slice(1), 2)
	let y = (yRaw[0] == '1' ? 1 : -1) * parseInt(yRaw.slice(1), 2)
	let r = (rRaw[0] == '1' ? 1 : -1) * parseInt(rRaw.slice(1), 2)
	return { x, y, r }
}

// jquery document.ready - binds listeners to ui
$(() => {
	$('#solve').on('click', () => {
		console.log('starting algorithm')

		$('#results tbody').html('')

		const config = {
			iterations: parseFloat($('#iterations').val()),
			size: parseFloat($('#size').val()),
			crossover: parseFloat($('#crossover').val()),
			mutation: parseFloat($('#mutation').val()),
			skip: parseFloat($('#skip').val()),
		}

		const params = {
			x: Math.round(parseFloat($('#x').val()) * 1000),
			y: Math.round(parseFloat($('#y').val()) * 1000),
			size: Math.round(parseFloat($('#width').val()) * 1000),
		}

		const stop = parseFloat($('#stop').val())

		const bitSize = parseInt($('#bitSize').val())

		genetic.evolve(config, { squareParams: params, stop, bitSize, helpers: { decodeCoords } })
	})
})
