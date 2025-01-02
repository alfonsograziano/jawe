import { writeFile } from "fs/promises";
import { FastifyInstance } from "fastify";
import { build } from "./app";

const writeOpenApiDefinition = async (app: FastifyInstance) => {
  try {
    await writeFile("./openapi-definition.yml", app.swagger({ yaml: true }));
  } catch (e) {
    app.log.warn(e, "Error writing open api definition file");
  }
};

const app = await build();

app.listen({ host: "0.0.0.0", port: 8001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`app listening at ${address}`);
});

await app.ready();
await writeOpenApiDefinition(app);
