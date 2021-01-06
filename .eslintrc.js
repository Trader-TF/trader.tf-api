module.exports = {
	env: {
		commonjs: true,
		es6: true,
		node: true
	},
	extends: [
		'standard'
	],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly'
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2018
	},
	plugins: [
		'@typescript-eslint'
	],
	rules: {
		'no-tabs': 0,
		indent: ['error', 'tab']
	}
}
