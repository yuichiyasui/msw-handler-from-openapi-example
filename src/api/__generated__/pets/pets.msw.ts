/**
 * Generated by orval v6.20.0 🍺
 * Do not edit manually.
 * Swagger PetStore Clone
 * Reference [OpenAPI example](https://github.com/OAI/OpenAPI-Specification/blob/main/examples/v3.0/petstore.yaml)
 * OpenAPI spec version: 1.0.0
 */
import { faker } from "@faker-js/faker";
import { HttpResponse, delay, http } from "msw";

export const getListPetsMock = () =>
  Array.from(
    { length: faker.number.int({ min: 1, max: 10 }) },
    (_, i) => i + 1,
  ).map(() => ({
    id: faker.number.int({ min: undefined, max: undefined }),
    name: faker.word.sample(),
    tag: faker.helpers.arrayElement([faker.word.sample(), undefined]),
  }));

export const getShowPetByIdMock = () => ({
  id: faker.number.int({ min: undefined, max: undefined }),
  name: faker.word.sample(),
  tag: faker.helpers.arrayElement([faker.word.sample(), undefined]),
});

export const getPetsMSW = () => [
  http.get("*/pets", async () => {
    await delay(1000);
    return new HttpResponse(JSON.stringify(getListPetsMock()), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
  http.post("*/pets", async () => {
    await delay(1000);
    return new HttpResponse(null, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
  http.get("*/pets/:petId", async () => {
    await delay(1000);
    return new HttpResponse(JSON.stringify(getShowPetByIdMock()), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
];
