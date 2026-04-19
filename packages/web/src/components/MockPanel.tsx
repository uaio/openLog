import { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.js';

interface MockPanelProps {
  deviceId?: string;
}

interface MockRule {
  id: string;
  pattern: string;
  method?: string;
  status: number;
  body?: string;
  createdAt: number;
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
  const [rules, setRules] = useState<MockRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const { t } = useI18n();

  // 加载已有规则
  const loadRules = useCallback(async () => {
    if (!deviceId) return;
    setLoadingRules(true);
    try {
      const data = await api.get(`/api/devices/${deviceId}/mocks`);
      setRules(Array.isArray(data) ? data : []);
    } catch {
      // 设备不存在或网络错误
      setRules([]);
    } finally {
      setLoadingRules(false);
    }
  }, [deviceId]);

  useEffect(() => {
    setRules([]);
    loadRules();
  }, [loadRules]);

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
      loadRules();
    } catch (e: any) {
      setMsg('❌ 失败: ' + e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  }, [deviceId, form, loadRules]);

  const handleRemoveRule = useCallback(
    async (mockId: string) => {
      if (!deviceId) return;
      try {
        await api.delete(`/api/devices/${deviceId}/mocks/${mockId}`);
        setRules((prev) => prev.filter((r) => r.id !== mockId));
      } catch (e: any) {
        setMsg('❌ 删除失败: ' + e.message);
        setTimeout(() => setMsg(''), 3000);
      }
    },
    [deviceId],
  );

  const handleClearAll = useCallback(async () => {
    if (!deviceId) return;
    if (!confirm(t.mockPanel.clearAllConfirm)) return;
    try {
      await api.delete(`/api/devices/${deviceId}/mocks`);
      setRules([]);
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
    <div style={{ padding: 20, maxWidth: 600, overflow: 'auto', height: '100%' }}>
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

      {/* 已有规则列表 */}
      {rules.length > 0 && (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 13 }}>
            已生效规则 ({rules.length})
          </div>
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                marginBottom: 6,
                backgroundColor: '#f9f9f9',
                borderRadius: 4,
                border: '1px solid #f0f0f0',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: '#1890ff',
                  backgroundColor: '#e6f7ff',
                  padding: '2px 6px',
                  borderRadius: 3,
                  flexShrink: 0,
                }}
              >
                {rule.method || 'ANY'}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={rule.pattern}
              >
                {rule.pattern}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: rule.status >= 400 ? '#ff4d4f' : '#52c41a',
                  flexShrink: 0,
                }}
              >
                {rule.status}
              </span>
              <button
                onClick={() => handleRemoveRule(rule.id)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#ff4d4f',
                  padding: '0 4px',
                  flexShrink: 0,
                }}
                title="删除此规则"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {loadingRules && rules.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: 12, fontSize: 13 }}>
          加载规则中...
        </div>
      )}

      {/* 添加规则表单 */}
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
            disabled={rules.length === 0}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              border: '1px solid #ff4d4f',
              borderRadius: 4,
              backgroundColor: '#fff',
              color: rules.length === 0 ? '#ccc' : '#ff4d4f',
              cursor: rules.length === 0 ? 'not-allowed' : 'pointer',
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
