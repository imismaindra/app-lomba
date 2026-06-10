import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { API_URL } from '../../config';

export interface UserPoints {
  totalPoints: number;
  level: string;
  nextLevelPoints: number;
  nextLevelName: string;
  co2Saved: number;
  itemsRecycled: number;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  points: number;
  icon: string;
  available: boolean;
}

interface EcoPointState {
  userPoints: UserPoints;
  rewards: Reward[];
  redeemingId: number | null;
  loading: boolean;
  error: string | null;
}

interface EcoPointResponse {
  success: boolean;
  userPoints: UserPoints;
  rewards: Reward[];
}

const getPointLevel = (totalPoints: number) => {
  if (totalPoints >= 700) {
    return {
      level: 'Platinum',
      nextLevelPoints: totalPoints,
      nextLevelName: 'Level maksimum',
    };
  }

  if (totalPoints >= 300) {
    return {
      level: 'Gold',
      nextLevelPoints: 700,
      nextLevelName: 'Platinum',
    };
  }

  if (totalPoints >= 100) {
    return {
      level: 'Silver',
      nextLevelPoints: 300,
      nextLevelName: 'Gold',
    };
  }

  return {
    level: 'Bronze',
    nextLevelPoints: 100,
    nextLevelName: 'Silver',
  };
};

const initialState: EcoPointState = {
  userPoints: {
    totalPoints: 0,
    level: 'Bronze',
    nextLevelPoints: 100,
    nextLevelName: 'Silver',
    co2Saved: 0,
    itemsRecycled: 0,
  },
  rewards: [
    {
      id: 1,
      name: 'Voucher Belanja',
      description: 'Voucher Rp10.000',
      points: 50,
      icon: 'cart-outline',
      available: true,
    },
    {
      id: 2,
      name: 'Pulsa Listrik',
      description: 'Pulsa Rp20.000',
      points: 100,
      icon: 'flash-outline',
      available: true,
    },
    {
      id: 3,
      name: 'Bibit Tanaman',
      description: 'Paket 3 bibit pohon',
      points: 150,
      icon: 'leaf-outline',
      available: true,
    },
    {
      id: 4,
      name: 'E-Tumbler',
      description: 'Tumbler stainless steel',
      points: 300,
      icon: 'cup-outline',
      available: false,
    },
    {
      id: 5,
      name: 'Voucher Makanan',
      description: 'Voucher Rp50.000',
      points: 500,
      icon: 'restaurant-outline',
      available: false,
    },
  ],
  redeemingId: null,
  loading: false,
  error: null,
};

export const fetchEcoPointData = createAsyncThunk<EcoPointResponse, string | null>(
  'ecoPoint/fetchEcoPointData',
  async (token, thunkAPI) => {
    try {
      if (!token) {
        return thunkAPI.rejectWithValue('Silakan login untuk memuat Eco Poin');
      }

      const response = await fetch(`${API_URL}/eco-points`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        return thunkAPI.rejectWithValue(data.error || 'Gagal memuat data Eco Poin');
      }

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue('Gagal terhubung ke server Eco Poin');
    }
  }
);

const ecoPointSlice = createSlice({
  name: 'ecoPoint',
  initialState,
  reducers: {
    startRedeem: (state, action: PayloadAction<number>) => {
      state.redeemingId = action.payload;
    },
    finishRedeem: (state, action: PayloadAction<number>) => {
      state.userPoints.totalPoints -= action.payload;
      state.redeemingId = null;
    },
    cancelRedeem: (state) => {
      state.redeemingId = null;
    },
    addPoints: (state, action: PayloadAction<number>) => {
      state.userPoints.totalPoints += action.payload;
    },
    addScanPoints: (state, action: PayloadAction<number>) => {
      const totalPoints = state.userPoints.totalPoints + action.payload;
      const itemsRecycled = state.userPoints.itemsRecycled + 1;
      const levelInfo = getPointLevel(totalPoints);

      state.userPoints = {
        ...state.userPoints,
        ...levelInfo,
        totalPoints,
        itemsRecycled,
        co2Saved: Number((itemsRecycled * 0.68).toFixed(1)),
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEcoPointData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEcoPointData.fulfilled, (state, action) => {
        state.loading = false;
        state.userPoints = action.payload.userPoints;
        state.rewards = action.payload.rewards;
      })
      .addCase(fetchEcoPointData.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error.message || 'Gagal memuat data Eco Poin';
      });
  },
});

export const { startRedeem, finishRedeem, cancelRedeem, addPoints, addScanPoints } = ecoPointSlice.actions;
export default ecoPointSlice.reducer;
