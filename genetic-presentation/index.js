var genetic = Genetic.create()

// aim for highest fitness possible
genetic.optimize = Genetic.Optimize.Maximize

// Tournament2 - selection method, selects 2 random individuals and then chooses one of them that is fitter
// selects a single individual for survival from a population (evolutionary algorithm)
genetic.select1 = Genetic.Select1.Tournament2
// also selects two individuals from a population for mating/crossover (makes algorith genetic)
genetic.select2 = Genetic.Select2.Tournament2

// function that creates an individual - random string with length matching to input text
genetic.seed = function () {
	function randomString(len) {
		var text = ''
		var charset = 'abcdefghijklmnopqrstuvwxyz0123456789 !@#$%^&*()-+,.'
		for (var i = 0; i < len; i++) text += charset.charAt(Math.floor(Math.random() * charset.length))

		return text
	}

	// create random strings that are equal in length to solution
	return randomString(this.userData.solution.length)
}

// function called when an individual has been selected for mutation
genetic.mutate = function (entity) {
	function replaceAt(str, index, character) {
		return str.substr(0, index) + character + str.substr(index + character.length)
	}

	// chromosomal drift - replaces random string character with one that has charcode 1 higher or lower
	var i = Math.floor(Math.random() * entity.length)
	return replaceAt(entity, i, String.fromCharCode(entity.charCodeAt(i) + (Math.floor(Math.random() * 2) ? 1 : -1)))
}

// function called when two individuals are selected for mating
genetic.crossover = function (mother, father) {
	// two-point crossover

	// selects 2 random indexes, ca<cb
	var len = mother.length
	var ca = Math.floor(Math.random() * len)
	var cb = Math.floor(Math.random() * len)
	if (ca > cb) {
		var tmp = cb
		cb = ca
		ca = tmp
	}

	// creates children from substrings of parents
	var son = father.substr(0, ca) + mother.substr(ca, cb - ca) + father.substr(cb)
	var daughter = mother.substr(0, ca) + father.substr(ca, cb - ca) + mother.substr(cb)

	return [son, daughter]
}

// function used to determine a fitness score for an individual
genetic.fitness = function (entity) {
	var fitness = 0

	for (let i in entity) {
		// increase fitness by 1 for each character that matches solution text
		if (entity[i] == this.userData.solution[i]) fitness += 1

		// award fractions of a point for each caracter, depending on how close it is to being correct
		fitness += (127 - Math.abs(entity.charCodeAt(i) - this.userData.solution.charCodeAt(i))) / 50
	}

	return fitness
}

// function called for each generation. returning false, means that the goal was reached and the algorithm should stop
genetic.generation = function (pop, generation, stats) {
	// stop running once we've reached the solution
	return pop[0].entity != this.userData.solution
}

// function called after set amount of generations, can be used to track calculation progress
// here it creates a row and appends it to the html table
genetic.notification = function (pop, generation, stats, isFinished) {
	var value = pop[0].entity
	this.last = this.last || value
	if (pop != 0 && value == this.last) return
	var solution = []
	var charCodes = []
	for (let i in value) {
		var diff = value.charCodeAt(i) - this.last.charCodeAt(i)
		var style = 'background: transparent;'

		// mark characters that changed to higher charcode with blue
		if (diff > 0) style = 'background: #2196F3; color: #fff;'
		// mark characters that changed to lower charcode with yellow
		else if (diff < 0) style = 'background: #FFEB3B; color: #000;'

		// mark matching characters with green
		if (value.charCodeAt(i) == this.userData.solution.charCodeAt(i)) style = 'background: #4CAF50; color: #000;'

		solution.push(`<span style="${style}">${value[i]}</span>`)

		let code = value.charCodeAt(i).toString()
		while (code.length < 3) code = '0' + code
		charCodes.push(`<span style="${style}">${code}</span>`)
	}

	var buf = ''
	buf += '<tr>'
	buf += '<td>' + generation + '</td>'
	buf += '<td>' + pop[0].fitness.toPrecision(5) + '</td>'
	buf += '<td>' + solution.join('') + '</td>'
	buf += '<td>' + charCodes.join('-') + '</td>'
	buf += '</tr>'
	$('#results tbody').prepend(buf)

	this.last = value
}

// jquery document.ready - binds listeners to ui
$(() => {
	$('#solve').on('click', () => {
		console.log('starting algorithm')

		$('#results tbody').html('')

		const solutionText = $('#quote').val()

		const config = {
			iterations: parseFloat($('#iterations').val()),
			size: parseFloat($('#size').val()),
			crossover: parseFloat($('#crossover').val()),
			mutation: parseFloat($('#mutation').val()),
			skip: parseFloat($('#skip').val()),
		}

		genetic.evolve(config, { solution: solutionText })
	})
})
