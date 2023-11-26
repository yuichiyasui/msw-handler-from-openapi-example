import { StoryObj, Meta } from "@storybook/react";
import { PetList } from "./PetList";

type ComponentType = typeof PetList;

const meta = {
  component: PetList,
} satisfies Meta<ComponentType>;

export default meta;

type StoryType = StoryObj<ComponentType>;

export const Default = {} satisfies StoryType;
