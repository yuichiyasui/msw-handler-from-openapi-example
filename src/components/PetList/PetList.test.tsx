import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { PetList } from "./PetList";
import { renderWithProviders } from "../../utils/testing";

const GET_PET_LIST_URL = "http://localhost:8080/pets";

const server = setupServer(
  http.get(GET_PET_LIST_URL, () => {
    return HttpResponse.json(
      [
        { id: 1, name: "タマ", tag: "cat" },
        { id: 2, name: "ポチ", tag: "dog" },
      ],
      { status: 200 },
    );
  }),
);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

test("ペットの一覧が表示される", async () => {
  renderWithProviders(<PetList />);

  await waitFor(() => {
    const petList = screen.getByRole("list");
    expect(petList).toBeInTheDocument();
  });

  expect(screen.getByText("タマ")).toBeInTheDocument();
  expect(screen.getByText("cat")).toBeInTheDocument();
  expect(screen.getByText("ポチ")).toBeInTheDocument();
  expect(screen.getByText("dog")).toBeInTheDocument();
});

test("ペットが登録されていない場合、メッセージが表示される", async () => {
  server.use(
    http.get(GET_PET_LIST_URL, () => {
      return HttpResponse.json([], { status: 200 });
    }),
  );

  renderWithProviders(<PetList />);

  await waitFor(() => {
    expect(screen.getByText("ペットが登録されていません")).toBeInTheDocument();
  });
});

test("ペットの一覧の取得に失敗した場合、エラーメッセージが表示される", async () => {
  server.use(
    http.get(GET_PET_LIST_URL, () => {
      return HttpResponse.error();
    }),
  );

  renderWithProviders(<PetList />);

  await waitFor(() => {
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
