import { fetchTasks } from "features/TodolistsList/tasks.reducer";
import { todolistsAPI, TodolistType } from "api/todolists-api";
import { appActions, RequestStatusType } from "app/app.reducer";
import { handleServerNetworkError } from "utils/error-utils";
import { AppThunk } from "app/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { clearTasksAndTodolists } from "common/actions/common.actions";
import { createAppAsyncThunk } from "utils/create-app-async-thunk";

// thunks
export const removeTodolist = createAppAsyncThunk<{ id: string }, string>(
  "todo/reomoveTodolist",
  async (id, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI;

    dispatch(appActions.setAppStatus({ status: "loading" }));
    //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
    dispatch(todolistsActions.changeTodolistEntityStatus({ id, entityStatus: "loading" }));
    const res = await todolistsAPI.deleteTodolist(id);
    //скажем глобально приложению, что асинхронная операция завершена
    dispatch(appActions.setAppStatus({ status: "succeeded" }));
    return { id };
  },
);
const fetchTodolists = createAppAsyncThunk("todo/fetchTodolist", async (id, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI;
  dispatch(appActions.setAppStatus({ status: "loading" }));
  const res = await todolistsAPI.getTodolists();
  dispatch(appActions.setAppStatus({ status: "succeeded" }));
  return { todolists: res.data };
  // .catch((error) => {
  //   handleServerNetworkError(error, dispatch);
  // });
});
const addTodolist = createAppAsyncThunk<{ todolist: TodolistType }, string>(
  "todo/addTodolist",
  async (title, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    dispatch(appActions.setAppStatus({ status: "loading" }));
    const res = await todolistsAPI.createTodolist(title);
    dispatch(appActions.setAppStatus({ status: "succeeded" }));
    return { todolist: res.data.data.item };
  },
);
const changeTodolistTitle = createAppAsyncThunk<
  {
    id: string;
    title: string;
  },
  {
    id: string;
    title: string;
  }
>("todo/changeTodolist", async (arg, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI;
  const res = await todolistsAPI.updateTodolist(arg.id, arg.title);
  return arg;
});
// export const fetchTodolistsTC = (): AppThunk => {
//   return (dispatch) => {
//     dispatch(appActions.setAppStatus({ status: "loading" }));
//     todolistsAPI
//       .getTodolists()
//       .then((res) => {
//         dispatch(todolistsActions.setTodolists({ todolists: res.data }));
//         dispatch(appActions.setAppStatus({ status: "succeeded" }));
//       })
//       .catch((error) => {
//         handleServerNetworkError(error, dispatch);
//       });
//   };
// };
// export const removeTodolistTC = (id: string): AppThunk => {
//   return (dispatch) => {
//     //изменим глобальный статус приложения, чтобы вверху полоса побежала
//     dispatch(appActions.setAppStatus({ status: "loading" }));
//     //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
//     dispatch(todolistsActions.changeTodolistEntityStatus({ id, entityStatus: "loading" }));
//     todolistsAPI.deleteTodolist(id).then((res) => {
//       dispatch(todolistsActions.removeTodolist({ id }));
//       //скажем глобально приложению, что асинхронная операция завершена
//       dispatch(appActions.setAppStatus({ status: "succeeded" }));
//     });
//   };
// };
// export const addTodolistTC = (title: string): AppThunk => {
//   return (dispatch) => {
//     dispatch(appActions.setAppStatus({ status: "loading" }));
//     todolistsAPI.createTodolist(title).then((res) => {
//       dispatch(todolistsActions.addTodolist({ todolist: res.data.data.item }));
//       dispatch(appActions.setAppStatus({ status: "succeeded" }));
//     });
//   };
// };
// export const changeTodolistTitleTC = (id: string, title: string): AppThunk => {
//   return (dispatch) => {
//     todolistsAPI.updateTodolist(id, title).then((res) => {
//       dispatch(todolistsActions.changeTodolistTitle({ id, title }));
//     });
//   };
// };

const initialState: TodolistDomainType[] = [];

const slice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    changeTodolistFilter: (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
      const todo = state.find((todo) => todo.id === action.payload.id);
      if (todo) {
        todo.filter = action.payload.filter;
      }
    },
    changeTodolistEntityStatus: (state, action: PayloadAction<{ id: string; entityStatus: RequestStatusType }>) => {
      const todo = state.find((todo) => todo.id === action.payload.id);
      if (todo) {
        todo.entityStatus = action.payload.entityStatus;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(removeTodolist.fulfilled, (state, action) => {
      const index = state.findIndex((todo) => todo.id === action.payload.id);
      if (index !== -1) state.splice(index, 1);
    });
    builder.addCase(addTodolist.fulfilled, (state, action) => {
      const newTodolist: TodolistDomainType = { ...action.payload.todolist, filter: "all", entityStatus: "idle" };
      state.unshift(newTodolist);
    });
    builder.addCase(changeTodolistTitle.fulfilled, (state, action) => {
      const todo = state.find((todo) => todo.id === action.payload.id);
      if (todo) {
        todo.title = action.payload.title;
      }
    });
    builder.addCase(fetchTodolists.fulfilled, (state, action) => {
      return action.payload.todolists.map((tl) => ({ ...tl, filter: "all", entityStatus: "idle" }));
    });
    builder.addCase(clearTasksAndTodolists, () => {
      return [];
    });
  },
});

export const todolistsReducer = slice.reducer;
export const todolistsActions = slice.actions;
export const todolistsThunks = { fetchTodolists, addTodolist, removeTodolist, changeTodolistTitle };

// types
export type FilterValuesType = "all" | "active" | "completed";
export type TodolistDomainType = TodolistType & {
  filter: FilterValuesType;
  entityStatus: RequestStatusType;
};
