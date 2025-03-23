module.exports = {
  RoundRobinLoadBalancer: require('./RoundRobin.js'),
  WeightedRoundRobinLoadBalancer: require('./WeightedRoundRobin.js'),
  LeastConnectionLoadBalancer: require('./LeastConnection.js'),
};
