require('@babel/register')({
  presets: ['@babel/preset-react', '@babel/preset-env']
});
const Home = require('./src/pages/Home.js').default;
console.log(Home);
const PublicLayout = require('./src/components/PublicLayout.js').default;
console.log(PublicLayout);
