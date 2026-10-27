const { isMainThread, parentPort, workerData } = require('worker_threads')

function fit(rows) {
  const weights = new Array(rows[0].features.length).fill(0)
  let bias = 0
  const count = { F: rows.filter(row => row.label === 'F').length, V: rows.filter(row => row.label === 'V').length }
  if (!count.F || !count.V) return { weights, bias: count.F ? 1 : -1 }
  for (let step = 0; step < 2500; step++) {
    const gradient = new Array(weights.length).fill(0)
    let biasGradient = 0
    for (const row of rows) {
      const score = row.features.reduce((sum, value, j) => sum + value * weights[j], bias)
      const residual = (1 / (1 + Math.exp(-score)) - (row.label === 'F' ? 1 : 0)) / (2 * count[row.label])
      biasGradient += residual
      for (let j = 0; j < weights.length; j++) gradient[j] += residual * row.features[j]
    }
    for (let j = 0; j < weights.length; j++) weights[j] -= gradient[j] + 0.01 * weights[j]
    bias -= biasGradient
  }
  return { weights, bias }
}

function train(rows, progress = () => {}) {
  const sheets = [...new Set(rows.map(row => Number(row.sheet)))].sort((a, b) => a - b)
  if (sheets.length < 5) throw new Error('Revise imagens de pelo menos cinco folhas diferentes')
  const foldBySheet = new Map(sheets.map((sheet, index) => [sheet, Math.min(4, Math.floor(index * 5 / sheets.length))]))
  const folds = []
  for (let fold = 0; fold < 5; fold++) {
    const development = rows.filter(row => foldBySheet.get(Number(row.sheet)) !== fold)
    const test = rows.filter(row => foldBySheet.get(Number(row.sheet)) === fold)
    const model = fit(development)
    const correct = test.filter(row => {
      const score = row.features.reduce((sum, value, j) => sum + value * model.weights[j], model.bias)
      return (score >= 0 ? 'F' : 'V') === row.label
    }).length
    folds.push({ fold, train: development.length, test: test.length, correct })
    progress(fold + 1)
  }
  const correct = folds.reduce((sum, fold) => sum + fold.correct, 0)
  return { ...fit(rows), development: { correct, wrong: rows.length - correct, total: rows.length, folds, purpose: 'model_selection_not_independent_validation' } }
}

module.exports = { train }
if (!isMainThread) {
  try {
    parentPort.postMessage({ result: train(workerData.rows, fold => parentPort.postMessage({ fold })) })
  } catch (error) {
    parentPort.postMessage({ error: error.message })
  }
}
