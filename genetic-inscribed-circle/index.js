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
	// 9 bits * 3 (x,y,r) = 27 bits
	return Math.random().toString('2').slice(2, 29)
}

// function called when an individual has been selected for mutation
genetic.mutate = function (entity) {
	// 50/50 between small and large mutation
	if (Math.random < 0.5) {
		// replace random bit
		let i = Math.floor(Math.random() * entity.length)
		return entity.substring(0, i) + entity[i] == '1' ? '0' : '1' + entity.substring(i + 1)
	} else {
		// replace random coordinate
		let random = ['x', 'y', 'z'][Math.floor(Math.random() * 3)]
		if (random == 'x') return Math.random().toString('2').slice(2, 11) + entity.substring(9, 27)
		else if (random == 'y') return entity.substring(0, 9) + Math.random().toString('2').slice(2, 11) + entity.substring(18, 27)
		else if (random == 'z') return entity.substring(0, 18) + Math.random().toString('2').slice(2, 11)
	}
}

// function called when two individuals are selected for mating
genetic.crossover = function (mother, father) {
	let mother_coords = {
		x: mother.slice(0, 9),
		y: mother.slice(9, 18),
		z: mother.slice(18, 27),
	}

	let father_coords = {
		x: father.slice(0, 9),
		y: father.slice(9, 18),
		z: father.slice(18, 27),
	}

	let random = ['x', 'y', 'z'][Math.floor(Math.random() * 3)]

	let son = {}
	let daughter = {}
	for (let [key, val] of Object.entries(father_coords))
		if (key == random) son[key] = val
		else daughter[key] = val

	for (let [key, val] of Object.entries(mother_coords))
		if (key != random) son[key] = val
		else daughter[key] = val

	son = son.x + son.y + son.z
	daughter = daughter.x + daughter.y + daughter.z

	return [son, daughter]
}

// function used to determine a fitness score for an individual
genetic.fitness = function (entity) {
	const squareSize = this.userData.squareParams.size
	const xOffset = this.userData.squareParams.x
	const yOffset = this.userData.squareParams.y

	// parse integers from bits
	let xRaw = entity.slice(0, 9)
	let yRaw = entity.slice(9, 18)
	let rRaw = entity.slice(18, 27)
	let x = (xRaw[0] == '1' ? 1 : -1) * parseInt(xRaw.slice(1), 2)
	let y = (yRaw[0] == '1' ? 1 : -1) * parseInt(yRaw.slice(1), 2)
	let r = (rRaw[0] == '1' ? 1 : -1) * parseInt(rRaw.slice(1), 2)

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

	let xRaw = currentValue.slice(0, 9)
	let yRaw = currentValue.slice(9, 18)
	let rRaw = currentValue.slice(18, 27)
	let x = (xRaw[0] == '1' ? 1 : -1) * parseInt(xRaw.slice(1), 2)
	let y = (yRaw[0] == '1' ? 1 : -1) * parseInt(yRaw.slice(1), 2)
	let r = (rRaw[0] == '1' ? 1 : -1) * parseInt(rRaw.slice(1), 2)

	const squareSize = this.userData.squareParams.size
	const offset = squareSize / 2
	const xOffset = this.userData.squareParams.x
	const yOffset = this.userData.squareParams.y
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
	ctx.arc(x + offset * 2 - xOffset, y + offset * 2 - yOffset, r, 0, 2 * Math.PI)
	ctx.fill()

	let tr = $('<tr></tr>')
	tr.append(`<td>${generation}</td>`)
	tr.append(`<td>${pop[0].fitness.toPrecision(5)}</td>`)
	tr.append(element)
	tr.append(`<td>x:${x}, y:${y}, r:${r}</td>`)
	let td = $('<td></td>')
	td.append(canvas)
	tr.append(td)
	$('#results tbody').prepend(tr)

	this.lastValue = currentValue
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
			x: parseFloat($('#x').val()),
			y: parseFloat($('#y').val()),
			size: parseFloat($('#width').val()),
		}

		const stop = parseFloat($('#stop').val())

		genetic.evolve(config, { squareParams: params, stop })
	})
})
