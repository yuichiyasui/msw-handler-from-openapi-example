import { Pets, Pet } from "../__generated__";

export const listPets200ResponseMock: Pets = [
  { id: 0, name: "dog", tag: "tag1" },
  { id: 1, name: "cat", tag: "tag2" },
];

export const showPetById200WithTagResponseMock: Pet = {
  id: 0,
  name: "dog",
  tag: "tag1",
};

export const showPetById200WithoutTagResponseMock: Pet = { id: 1, name: "cat" };
