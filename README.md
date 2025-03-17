# ChordCove Frontend

## Import Path Conventions

To maintain consistency across the codebase, follow these import path conventions:

- Types: Use `@/types/...` for all type imports

  ```typescript
  import { SheetMetaData } from "@/types/sheet";
  import { ApiResponse } from "@/types/api";
  ```

- Components: Use `@components/...` for component imports (without the leading slash)

  ```typescript
  import AlbumCard from "@components/basic/AlbumCard";
  ```

- Pages: Use `@pages/...` for page imports (without the leading slash)

  ```typescript
  import HomePage from "@pages/Home";
  ```

- Stores/Redux: Use `@stores/...` for store imports (without the leading slash)

  ```typescript
  import { RootState } from "@stores/store";
  import { setToken } from "@stores/authSlice";
  ```

- Utilities: Use `@utils/...` for utility imports (without the leading slash)
  ```typescript
  import { fetchApi } from "@utils/api";
  ```

## API Response Structure Update

The backend API now returns responses with a standardized structure that includes a `.data` property. All API responses follow this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### How to Handle API Responses

We've added utility functions to handle this new structure. Use the `fetchApi` function for all API calls:

```typescript
import { fetchApi } from "@utils/api";

// Example usage:
const data = await fetchApi<YourDataType>("your-api-endpoint");
```

The `fetchApi` function will:

1. Make the API request
2. Check if the response was successful
3. Extract the data from the `.data` property
4. Handle errors appropriately

### Migration Notes

- All direct `fetch` calls to backend API endpoints should be replaced with `fetchApi`
- The response data is now accessed directly without needing to check `.data` in your components
- Error handling is built into the utility function

For any questions or issues, please contact the development team.
