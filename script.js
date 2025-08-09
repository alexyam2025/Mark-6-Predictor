// Utility: parse user-entered results
function parseResults(input) {
  return input
    .split('\n')
    .map(line => line.match(/\d+/g)?.map(Number))
    .filter(arr => arr && arr.length === 6);
}

// Frequency Analysis
function frequencyAnalysis(draws) {
  const freq = Array(50).fill(0);
  draws.forEach(draw => draw.forEach(num => freq[num]++));
  return freq
    .map((count, num) => ({ num, count }))
    .slice(1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(o => o.num);
}

// Overdue (gap) analysis
function overdueAnalysis(draws) {
  const lastSeen = Array(50).fill(-1);
  draws.forEach((draw, idx) => draw.forEach(num => lastSeen[num] = idx));
  return lastSeen
    .map((seen, num) => ({ num, gap: seen === -1 ? draws.length : draws.length - seen }))
    .slice(1)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 6)
    .map(o => o.num);
}

// Hot/Cold analysis (recent vs older half of draws)
function hotColdAnalysis(draws) {
  const half = Math.floor(draws.length / 2);
  const freqRecent = Array(50).fill(0);
  draws.slice(0, half).forEach(draw => draw.forEach(num => freqRecent[num]++));
  return freqRecent
    .map((count, num) => ({ num, count }))
    .slice(1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(o => o.num);
}

// Sum range analysis
function sumRangeAnalysis(draws) {
  const sums = draws.map(draw => draw.reduce((a,b) => a+b, 0));
  const avg = sums.reduce((a,b) => a+b, 0) / sums.length;
  const midNums = Array.from({length: 49}, (_,i) => i+1)
    .map(num => ({ num, diff: Math.abs(avg - num*6/2) })); // heuristic
  return midNums.sort((a,b) => a.diff - b.diff).slice(0, 6).map(o => o.num);
}

// Odd/Even balance
function oddEvenAnalysis(draws) {
  const freqOdd = Array(50).fill(0);
  const freqEven = Array(50).fill(0);
  draws.forEach(draw => draw.forEach(num => {
    if (num % 2 === 0) freqEven[num]++; else freqOdd[num]++;
  }));
  const topOdd = freqOdd.map((count,num) => ({num,count})).slice(1).sort((a,b) => b.count-a.count).slice(0,3);
  const topEven = freqEven.map((count,num) => ({num,count})).slice(1).sort((a,b) => b.count-a.count).slice(0,3);
  return [...topOdd, ...topEven].map(o => o.num);
}

// Range distribution (1-10, 11-20, ...)
function rangeDistribution(draws) {
  const ranges = [ [1,10], [11,20], [21,30], [31,40], [41,49] ];
  const freqPerRange = Array(ranges.length).fill(0);
  draws.forEach(draw => {
    draw.forEach(num => {
      ranges.forEach((r,i) => {
        if(num >= r[0] && num <= r[1]) freqPerRange[i]++;
      });
    });
  });
  const selected = [];
  ranges.forEach((r, i) => {
    const nums = [];
    for(let n = r[0]; n <= r[1]; n++) nums.push(n);
    // pick a random number in this range for demo purposes
    selected.push(nums[Math.floor(Math.random()*(nums.length))]);
  });
  return selected.slice(0,6);
}

// Weighted average model: favor recent draws
function weightedAverageModel(draws) {
  const weights = Array(draws.length).fill(0).map((_,i) => draws.length - i);
  const scores = Array(50).fill(0);
  draws.forEach((draw, idx) => draw.forEach(num => scores[num] += weights[idx]));
  return scores
    .map((score, num) => ({ num, score }))
    .slice(1)
    .sort((a,b) => b.score - a.score)
    .slice(0,6)
    .map(o => o.num);
}

// Moving average prediction: pick numbers trending up
function movingAveragePrediction(draws) {
  const half = Math.floor(draws.length / 2);
  const oldFreq = Array(50).fill(0);
  const newFreq = Array(50).fill(0);
  draws.slice(half).forEach(draw => draw.forEach(num => oldFreq[num]++));
  draws.slice(0, half).forEach(draw => draw.forEach(num => newFreq[num]++));
  const trends = newFreq.map((nf, num) => ({ num, trend: nf - oldFreq[num] }));
  return trends
    .slice(1)
    .sort((a,b) => b.trend - a.trend)
    .slice(0, 6)
    .map(o => o.num);
}

// Combine predictions with weights
function ensemble(predictions) {
  const scores = Array(50).fill(0);
  predictions.forEach((pred, idx) => {
    const weight = idx === predictions.length-1 ? 2 : 1; // slightly boost final model
    pred.forEach(num => scores[num] += weight);
  });
  return scores
    .map((score, num) => ({ num, score }))
    .slice(1)
    .sort((a,b) => b.score - a.score)
    .slice(0, 6)
    .map(o => o.num);
}

// Attach events
document.getElementById('predictBtn').addEventListener('click', () => {
  const draws = parseResults(document.getElementById('pastResults').value);
  if (draws.length === 0) return alert('Please enter valid results');

  const models = [
    {name: 'Frequency Analysis', fn: frequencyAnalysis},
    {name: 'Overdue Analysis', fn: overdueAnalysis},
    {name: 'Hot Numbers (Recent)', fn: hotColdAnalysis},
    {name: 'Sum Range Targeting', fn: sumRangeAnalysis},
    {name: 'Odd/Even Balance', fn: oddEvenAnalysis},
    {name: 'Range Distribution', fn: rangeDistribution},
    {name: 'Weighted Average', fn: weightedAverageModel},
    {name: 'Moving Average Trends', fn: movingAveragePrediction}
  ];

  let predictions = [];
  const modelResultsDiv = document.getElementById('modelResults');
  modelResultsDiv.innerHTML = '';

  models.forEach(m => {
    const result = m.fn(draws);
    predictions.push(result);
    const card = document.createElement('div');
    card.className = 'model-card';
    card.innerHTML = `<strong>${m.name}:</strong> ${result.join(', ')}`;
    modelResultsDiv.appendChild(card);
  });

  const ensembleResult = ensemble(predictions);
  document.getElementById('ensemblePrediction').textContent = ensembleResult.join(', ');
  document.getElementById('resultsDisplay').classList.remove('hidden');
});

document.getElementById('loadDataBtn').addEventListener('click', () => {
  const n = parseInt(document.getElementById('numDraws').value);
  const sample = generateSampleData(n);
  document.getElementById('pastResults').value = sample.join('\n');
});

// For demo: generate random realistic past draws
function generateSampleData(n) {
  let draws = [];
  for (let i = 0; i < n; i++) {
    const nums = [];
    while(nums.length < 6) {
      const num = Math.floor(Math.random()*49)+1;
      if(!nums.includes(num)) nums.push(num);
    }
    draws.push(nums.join(', '));
  }
  return draws;
}
