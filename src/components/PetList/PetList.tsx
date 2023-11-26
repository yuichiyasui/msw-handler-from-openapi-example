import { useListPets } from "../../api/__generated__/pets/pets";

export const PetList = () => {
  const { data, error, isLoading } = useListPets();

  if (isLoading) {
    return <p>loading...</p>;
  }

  if (error) {
    return <p role="alert">error</p>;
  }

  if (data?.length === 0) {
    return <p>ペットが登録されていません</p>;
  }

  return (
    <ul>
      {data?.map((pet) => (
        <li key={pet.id}>
          <p>{pet.name}</p>
          <p>{pet.tag}</p>
        </li>
      ))}
    </ul>
  );
};
