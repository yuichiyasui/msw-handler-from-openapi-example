import { StoryObj, Meta } from "@storybook/react";
import { PetRegistrationForm } from "./PetRegistrationForm";

type ComponentType = typeof PetRegistrationForm;

const meta = {
  component: PetRegistrationForm,
} satisfies Meta<ComponentType>;

export default meta;

type StoryType = StoryObj<ComponentType>;

export const Default = {} satisfies StoryType;
