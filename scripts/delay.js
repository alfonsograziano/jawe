const args = process.argv.slice(2);
const seconds = parseInt(args[0], 10);

if (isNaN(seconds)) {
  console.error('Please provide the number of seconds as an argument.');
  process.exit(1);
}

setTimeout(() => {
  process.exit(0);
}, seconds * 1000);
