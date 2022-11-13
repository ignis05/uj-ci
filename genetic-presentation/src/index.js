import $ from 'jquery'
import Genetic from 'genetic-js'

var genetic = Genetic.create()

genetic.optimize = Genetic.Optimize.Maximize
genetic.select1 = Genetic.Select1.Tournament2
genetic.select2 = Genetic.Select2.Tournament2

// start with random string that has the same length as text
genetic.seed = function () {
	function randomString(len) {
		var text = ''
		var charset = 'abcdefghijklmnopqrstuvwxyz0123456789'
		for (var i = 0; i < len; i++) text += charset.charAt(Math.floor(Math.random() * charset.length))

		return text
	}

	// create random strings that are equal in length to solution
	return randomString(this.userData.solution.length)
}

genetic.mutate = function (entity) {
	function replaceAt(str, index, character) {
		return str.substr(0, index) + character + str.substr(index + character.length)
	}

	// chromosomal drift
	var i = Math.floor(Math.random() * entity.length)
	return replaceAt(entity, i, String.fromCharCode(entity.charCodeAt(i) + (Math.floor(Math.random() * 2) ? 1 : -1)))
}

genetic.crossover = function (mother, father) {
	// two-point crossover
	var len = mother.length
	var ca = Math.floor(Math.random() * len)
	var cb = Math.floor(Math.random() * len)
	if (ca > cb) {
		var tmp = cb
		cb = ca
		ca = tmp
	}

	var son = father.substr(0, ca) + mother.substr(ca, cb - ca) + father.substr(cb)
	var daughter = mother.substr(0, ca) + father.substr(ca, cb - ca) + mother.substr(cb)

	return [son, daughter]
}

genetic.fitness = function (entity) {
	var fitness = 0

	for (let i in entity) {
		// increase fitness for each character that matches
		if (entity[i] == this.userData.solution[i]) fitness += 1

		// award fractions of a point as we get warmer
		fitness += (127 - Math.abs(entity.charCodeAt(i) - this.userData.solution.charCodeAt(i))) / 50
	}

	return fitness
}

genetic.generation = function (pop, generation, stats) {
	// stop running once we've reached the solution
	return pop[0].entity != this.userData.solution
}

genetic.notification = function (pop, generation, stats, isFinished) {
	function lerp(a, b, p) {
		return a + (b - a) * p
	}

	var value = pop[0].entity
	this.last = this.last || value

	if (pop != 0 && value == this.last) return

	var solution = []
	for (let i in value) {
		var diff = value.charCodeAt(i) - this.last.charCodeAt(i)
		var style = 'background: transparent;'
		if (diff > 0) style = 'background: rgb(0,200,50); color: #fff;'
		else if (diff < 0) style = 'background: rgb(0,100,50); color: #fff;'

		solution.push('<span style="' + style + '">' + value[i] + '</span>')
	}

	var buf = ''
	buf += '<tr>'
	buf += '<td>' + generation + '</td>'
	buf += '<td>' + pop[0].fitness.toPrecision(5) + '</td>'
	buf += '<td>' + solution.join('') + '</td>'
	buf += '</tr>'
	$('#results tbody').prepend(buf)

	this.last = value
}

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
