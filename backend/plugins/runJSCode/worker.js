process.stdin.on("data", (data) => {
  try {
    const { inputs, code } = JSON.parse(data.toString());

    // Create a new Function and pass inputs
    const func = new Function("inputs", `"use strict"; ${code}`);
    const result = func(inputs);

    // Send result back to the parent process
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    // Send error back to the parent process
    process.stderr.write(error.message);
    process.exit(1);
  }
});
