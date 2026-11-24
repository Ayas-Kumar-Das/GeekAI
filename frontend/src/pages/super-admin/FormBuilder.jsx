import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Save, Eye,
  Type, Mail, Phone, Hash, List, Circle, CheckSquare, Calendar,
  AlignLeft, Upload, Globe, AlertCircle,
} from 'lucide-react'
import client from '../../api/client'
import toast from 'react-hot-toast'

const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: Type, description: 'Short text answer' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Email address' },
  { type: 'phone', label: 'Phone', icon: Phone, description: 'Phone number' },
  { type: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft, description: 'Multi-line text' },
  { type: 'dropdown', label: 'Dropdown', icon: List, description: 'Select one option' },
  { type: 'radio', label: 'Radio', icon: Circle, description: 'Choose one option' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Multiple choices' },
  { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { type: 'file', label: 'File/Image', icon: Upload, description: 'File upload' },
]

const ICON_MAP = { text: Type, email: Mail, phone: Phone, number: Hash, textarea: AlignLeft, dropdown: List, radio: Circle, checkbox: CheckSquare, date: Calendar, file: Upload }

function newField(type, order) {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    label: `${FIELD_TYPES.find(f => f.type === type)?.label || 'Field'} ${order + 1}`,
    placeholder: '',
    required: false,
    options: ['dropdown', 'radio', 'checkbox'].includes(type)
      ? [{ label: 'Option 1', value: 'option_1' }]
      : null,
    validation: null,
    order,
    help_text: '',
  }
}

function FieldEditor({ field, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const Icon = ICON_MAP[field.type] || Type

  const updateField = (key, value) => onChange({ ...field, [key]: value })
  const updateOptions = (options) => onChange({ ...field, options })

  const addOption = () => {
    const opts = field.options || []
    const idx = opts.length
    updateOptions([...opts, { label: `Option ${idx + 1}`, value: `option_${idx + 1}` }])
  }

  const updateOption = (i, key, val) => {
    const opts = [...(field.options || [])]
    opts[i] = { ...opts[i], [key]: val }
    updateOptions(opts)
  }

  const removeOption = (i) => {
    updateOptions(field.options.filter((_, idx) => idx !== i))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Field header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white rounded-md border border-gray-200 shadow-xs">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {FIELD_TYPES.find(f => f.type === field.type)?.label || field.type}
          </span>
          {field.required && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">Required</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors" title="Move up">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors" title="Move down">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 cursor-pointer transition-colors ml-1" title="Delete field">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Field config */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Label *</label>
            <input
              value={field.label}
              onChange={e => updateField('label', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder="Field label"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Placeholder</label>
            <input
              value={field.placeholder || ''}
              onChange={e => updateField('placeholder', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder="Placeholder text"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Help Text</label>
          <input
            value={field.help_text || ''}
            onChange={e => updateField('help_text', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            placeholder="Optional helper text shown below the field"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.required}
            onChange={e => updateField('required', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <label htmlFor={`required-${field.id}`} className="text-sm text-gray-700 select-none cursor-pointer">
            Required field
          </label>
        </div>

        {/* Options for dropdown/radio/checkbox */}
        {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Options</label>
            <div className="space-y-2">
              {(field.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt.label}
                    onChange={e => updateOption(i, 'label', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder={`Option ${i + 1} label`}
                  />
                  <input
                    value={opt.value}
                    onChange={e => updateOption(i, 'value', e.target.value)}
                    className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="value"
                  />
                  <button
                    onClick={() => removeOption(i)}
                    className="p-1.5 text-gray-400 hover:text-red-600 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Option
              </button>
            </div>
          </div>
        )}

        {/* Validation for text/number */}
        {['text', 'textarea', 'number'].includes(field.type) && (
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Validation (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              {field.type === 'number' ? (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min value</label>
                    <input
                      type="number"
                      value={field.validation?.min ?? ''}
                      onChange={e => updateField('validation', { ...field.validation, min: e.target.value ? Number(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max value</label>
                    <input
                      type="number"
                      value={field.validation?.max ?? ''}
                      onChange={e => updateField('validation', { ...field.validation, max: e.target.value ? Number(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-gray-900"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min length</label>
                    <input
                      type="number" min="0"
                      value={field.validation?.min_length ?? ''}
                      onChange={e => updateField('validation', { ...field.validation, min_length: e.target.value ? Number(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max length</label>
                    <input
                      type="number" min="0"
                      value={field.validation?.max_length ?? ''}
                      onChange={e => updateField('validation', { ...field.validation, max_length: e.target.value ? Number(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-gray-900"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FormPreview({ fields }) {
  if (!fields.length) return (
    <div className="text-center py-12 text-gray-400">
      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">No fields yet. Add fields from the left panel.</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {fields.map(field => {
        const Icon = ICON_MAP[field.type] || Type
        return (
          <div key={field.id}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {field.help_text && <p className="text-xs text-gray-500 mb-1">{field.help_text}</p>}
            {field.type === 'textarea' ? (
              <textarea rows={3} disabled placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 resize-none opacity-70" />
            ) : field.type === 'dropdown' ? (
              <select disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 opacity-70">
                <option value="">Select…</option>
                {(field.options || []).map(o => <option key={o.value}>{o.label}</option>)}
              </select>
            ) : ['radio', 'checkbox'].includes(field.type) ? (
              <div className="space-y-1.5">
                {(field.options || []).map(o => (
                  <label key={o.value} className="flex items-center gap-2 text-sm text-gray-700 opacity-70">
                    <input type={field.type === 'radio' ? 'radio' : 'checkbox'} disabled />
                    {o.label}
                  </label>
                ))}
              </div>
            ) : field.type === 'file' ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center opacity-70">
                <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Click to upload file</p>
              </div>
            ) : (
              <input type={field.type === 'phone' ? 'tel' : field.type}
                disabled placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 opacity-70" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function FormBuilder() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('builder') // 'builder' | 'preview'

  useEffect(() => {
    Promise.all([
      client.get(`/super-admin/events/${id}`),
      client.get(`/super-admin/events/${id}/form-schema`),
    ]).then(([evtRes, schemaRes]) => {
      setEvent(evtRes.data)
      const schema = schemaRes.data?.schema
      if (schema?.fields?.length) {
        setFields(schema.fields.sort((a, b) => a.order - b.order))
      }
    }).catch(() => toast.error('Failed to load event or form schema'))
      .finally(() => setLoading(false))
  }, [id])

  const addField = (type) => {
    setFields(prev => [...prev, newField(type, prev.length)])
  }

  const updateField = (idx, updated) => {
    setFields(prev => {
      const next = [...prev]
      next[idx] = updated
      return next
    })
  }

  const deleteField = (idx) => {
    setFields(prev => prev.filter((_, i) => i !== idx).map((f, i) => ({ ...f, order: i })))
  }

  const moveField = (idx, direction) => {
    setFields(prev => {
      const next = [...prev]
      const targetIdx = idx + direction
      if (targetIdx < 0 || targetIdx >= next.length) return next
      ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
      return next.map((f, i) => ({ ...f, order: i }))
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const schema = {
        fields: fields.map((f, i) => ({ ...f, order: i })),
        version: 1,
      }
      await client.put(`/super-admin/events/${id}/form-schema`, schema)
      toast.success('Form schema saved!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save form schema')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">Loading form builder…</div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/super-admin/events/${id}/edit`} className="text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-extrabold text-gray-900">Form Builder</h2>
          <p className="text-gray-500 text-sm mt-0.5">{event?.name} — Registration form designer</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(t => t === 'builder' ? 'preview' : 'builder')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            {activeTab === 'builder' ? 'Preview Form' : 'Back to Builder'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Schema'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Standard fields</strong> (name, email, phone, institution, category, photo) are always included in registration.
        Add <strong>custom fields</strong> here for event-specific information — they'll appear after the standard fields.
        Don't forget to <Link to={`/super-admin/events/${id}/edit`} className="underline">publish the event</Link> for public registration to go live.
      </div>

      {activeTab === 'preview' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-lg">
          <h3 className="font-bold text-gray-900 mb-6">Custom Fields Preview</h3>
          <FormPreview fields={fields} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Field palette */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-gray-500" /> Add Field
              </h3>
              <div className="space-y-1.5">
                {FIELD_TYPES.map(({ type, label, icon: Icon, description }) => (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors group cursor-pointer"
                  >
                    <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Field canvas */}
          <div className="lg:col-span-2 space-y-3">
            {fields.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
                <Plus className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No custom fields yet</p>
                <p className="text-sm mt-1">Click a field type on the left to add it</p>
              </div>
            ) : (
              fields.map((field, idx) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  onChange={(updated) => updateField(idx, updated)}
                  onDelete={() => deleteField(idx)}
                  onMoveUp={() => moveField(idx, -1)}
                  onMoveDown={() => moveField(idx, 1)}
                  isFirst={idx === 0}
                  isLast={idx === fields.length - 1}
                />
              ))
            )}

            {fields.length > 0 && (
              <div className="text-center py-2">
                <p className="text-xs text-gray-400">{fields.length} custom field{fields.length !== 1 ? 's' : ''} configured</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
