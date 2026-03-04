import { supabase } from './supabase';
import { BaziEngineResult } from './baziEngine';

/**
 * 八字档案数据结构
 */
export interface BaziRecord {
  id: string;
  user_id?: string;
  name: string;
  gender: '男' | '女';
  birth_date: string;
  birth_time: string;
  use_solar_time: boolean;
  longitude?: number;
  bazi_data: BaziEngineResult;
  ai_reports: {
    personality: string;
    career: string;
    relationship: string;
  };
  created_at: string;
}

/**
 * 保存八字档案
 */
export async function saveBaziRecord(data: {
  name: string;
  gender: '男' | '女';
  birthDate: string;
  birthTime: string;
  useSolarTime: boolean;
  longitude?: number;
  baziData: BaziEngineResult;
  aiReports: {
    personality: string;
    career: string;
    relationship: string;
  };
}): Promise<{ success: boolean; error?: string; recordId?: string }> {
  try {
    // 获取当前用户（如果已登录）
    const { data: { user } } = await supabase.auth.getUser();

    // 插入数据
    const { data: record, error } = await supabase
      .from('bazi_records')
      .insert([
        {
          user_id: user?.id || null,
          name: data.name,
          gender: data.gender,
          birth_date: data.birthDate,
          birth_time: data.birthTime,
          use_solar_time: data.useSolarTime,
          longitude: data.longitude,
          bazi_data: data.baziData,
          ai_reports: data.aiReports,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase 保存错误:', error);

      // 详细错误信息
      if (error.code === '42501') {
        return {
          success: false,
          error: 'RLS 权限错误：请在 Supabase 中启用 Row Level Security 并添加策略',
        };
      }

      if (error.code === '23505') {
        return {
          success: false,
          error: '数据重复：该档案已存在',
        };
      }

      return {
        success: false,
        error: `保存失败：${error.message}`,
      };
    }

    return {
      success: true,
      recordId: record.id,
    };
  } catch (error) {
    console.error('保存档案异常:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 获取历史档案（最近 10 条）
 */
export async function getHistoryRecords(): Promise<{
  success: boolean;
  records?: BaziRecord[];
  error?: string;
}> {
  try {
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();

    // 构建查询
    let query = supabase
      .from('bazi_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // 如果用户已登录，只查询该用户的记录
    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase 查询错误:', error);

      if (error.code === '42501') {
        return {
          success: false,
          error: 'RLS 权限错误：请在 Supabase 中启用 Row Level Security 并添加策略',
        };
      }

      return {
        success: false,
        error: `查询失败：${error.message}`,
      };
    }

    return {
      success: true,
      records: data as BaziRecord[],
    };
  } catch (error) {
    console.error('查询档案异常:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 删除档案
 */
export async function deleteBaziRecord(recordId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('bazi_records')
      .delete()
      .eq('id', recordId);

    if (error) {
      console.error('Supabase 删除错误:', error);
      return {
        success: false,
        error: `删除失败：${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('删除档案异常:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}
