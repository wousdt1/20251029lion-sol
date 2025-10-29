import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import counterReducer from './bot'



export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

const persistConfig = {
  key: "bananatool_sol",
  storage: storage,
};

// const myPersistReducer = persistReducer(persistConfig, counterReducer);

// const store = configureStore({
//   reducer: myPersistReducer,
//   middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false })
// });

// export const persistor = persistStore(store);

const store = configureStore({
  reducer: counterReducer,
});
export default store;
