import { createSlice } from "@reduxjs/toolkit";

const socketSlice = createSlice({
    name: "socket",
    initialState: {
        status: false,
    },
    reducers: {
        changeSocketStatus: (state) => {
            state.status = !state.status;
        },
        resetSocketStatus: (state) => {
            state.status = false;
        }
    }
}
);

export const { changeSocketStatus, resetSocketStatus } = socketSlice.actions;
export default socketSlice.reducer;
