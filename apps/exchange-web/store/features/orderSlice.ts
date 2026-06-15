import { createSlice } from "@reduxjs/toolkit";

const orderSlice = createSlice({
    name: "order",
    initialState: {
        orderCountStatus: false,
    },
    reducers: {
        changeOrder: (state) => {
            state.orderCountStatus = !state.orderCountStatus;
        },
        resetOrderChange: (state) => {
            state.orderCountStatus = false;
        }
    }
}
);

export const { changeOrder, resetOrderChange } = orderSlice.actions;
export default orderSlice.reducer;