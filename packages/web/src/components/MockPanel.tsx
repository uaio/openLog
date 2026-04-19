import { useState, useCallback } from 'react';
import { api } from '../api/client.js';

interface MockPanelProps {
  deviceId?: string;
}

interface MockRuleForm {
  pattern: string;
  method: string;
  status: number;
  body: string;
}

const defaultForm: MockRuleForm = { pattern: '', method: 'GET', status: 200, body: '{"ok":true}' };

export function MockPanel({ deviceId }: MockPanelProps) {
  const [form, setForm] = useState<MockRuleForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!deviceId || !form.pattern.trim()) return;
    setSaving(true);
    try {
      await api.post(`/api/devices/${deviceId}/mocks`, {
        pattern: form.pattern,
        method: form.method || undefined,
        status: Number(form.status),
        headers: {},
        body: form.body,
      });
      setMsg('✅ Mock 规则已添加到设备');
      setForm(defaultForm);
    } catch (e: any) {
      setMsg('❌ 失败: ' + e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  }, [deviceId, form]);

  const handleClearAll = useCallback(async () => {
    if (!deviceId) return;
    if (!confirm('清空该设备所有 Mock 规则?')) return;
    try {
      await api.delete(`/api/devices/${deviceId}/mocks`);
      setMsg('✅ 已清空所有 Mock 规则');
    } catch (e: any) {
      setMsg('❌ 失败: ' + e.message);
    } finally {
      setTimeout(() => setMsg(''), 3000);
    }
  }, [deviceId]);

  if (!deviceId)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#999',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 48 }}>🎭</div>
        <div>请选择设备后使用 Mock</div>
      </div>
    );

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>🎭 API Mock</div>
      {msg && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: 12,
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {msg}
        </div>
      )}

      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 13 }}>添加 Mock 规则</div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
            URL 匹配规则（支持正则）
          </label>
          <input
            value={form.pattern}
            onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
            placeholder="/api/user"
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              fontSize: 13,
              boxSizing: 'border-box' as const,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
              Method
            </label>
            <select
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                fontSize: 13,
              }}
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
              <option>PATCH</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
              Status Code
            </label>
            <input
              type="number"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: Number(e.target.value) }))}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                fontSize: 13,
                boxSizing: 'border-box' as const,
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
            Response Body (JSON)
          </label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={4}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'monospace',
              resize: 'vertical',
              boxSizing: 'border-box' as const,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.pattern.trim()}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              border: '1px solid #1890ff',
              borderRadius: 4,
              backgroundColor: '#1890ff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            ➕ 添加 Mock
          </button>
          <button
            onClick={handleClearAll}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              border: '1px solid #ff4d4f',
              borderRadius: 4,
              backgroundColor: '#fff',
              color: '#ff4d4f',
              cursor: 'pointer',
            }}
          >
            🗑 清空全部
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#888', lineHeight: 1.8 }}>
        <div>• Mock 规则会直接推送到设备端，由 SDK 拦截 fetch 请求</div>
        <div>
          • URL 匹配支持正则表达式，如 <code>/api/.*</code>
        </div>
        <div>• 关闭 App 后规则自动清除</div>
      </div>
    </div>
  );
}
