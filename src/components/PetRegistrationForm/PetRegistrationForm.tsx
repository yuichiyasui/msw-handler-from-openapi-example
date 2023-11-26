import { FormEvent, useState } from "react";
import { useCreatePets } from "../../api/__generated__/pets/pets";

export const PetRegistrationForm = () => {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { mutateAsync } = useCreatePets();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      await mutateAsync({
        data: {
          name,
          tag,
        },
      });
      setName("");
      setTag("");
    } catch (error) {
      setErrorMessage("Failed to register pet");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Category:
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
      </label>
      <button type="submit">Register Pet</button>
      {errorMessage && <p>{errorMessage}</p>}
    </form>
  );
};
