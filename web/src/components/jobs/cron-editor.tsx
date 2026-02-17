import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface CronEditorProps {
  value: string
  onChange: (value: string) => void
}

function parseGrid(cron: string): boolean[][] {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(false) as boolean[])
  try {
    const parts = cron.trim().split(/\s+/)
    if (parts.length < 5) return grid

    const minutePart = parts[0]
    const hourPart = parts[1]
    const dowPart = parts[4]

    if (minutePart !== '0' && minutePart !== '*') return grid

    const hours = expandField(hourPart, 0, 23)
    const dows = expandField(dowPart, 0, 6)

    for (const d of dows) {
      for (const h of hours) {
        // cron: 0=Sun, convert to 0=Mon
        const dayIdx = d === 0 ? 6 : d - 1
        if (dayIdx >= 0 && dayIdx < 7) grid[dayIdx][h] = true
      }
    }
  } catch { /* ignore parse errors */ }
  return grid
}

function expandField(field: string, min: number, max: number): number[] {
  if (field === '*') return Array.from({ length: max - min + 1 }, (_, i) => i + min)
  const result: number[] = []
  for (const part of field.split(',')) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      for (let i = a; i <= b; i++) result.push(i)
    } else if (part.includes('/')) {
      const [, step] = part.split('/').map(Number)
      for (let i = min; i <= max; i += step) result.push(i)
    } else {
      result.push(Number(part))
    }
  }
  return result
}

function gridToCron(grid: boolean[][]): string {
  const activeHours = new Set<number>()
  const activeDows = new Set<number>()

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (grid[d][h]) {
        activeHours.add(h)
        // Convert Mon=0 to cron dow (1=Mon, 0=Sun)
        activeDows.add(d === 6 ? 0 : d + 1)
      }
    }
  }

  if (activeHours.size === 0 || activeDows.size === 0) return '0 * * * *'

  const hourStr = compactField([...activeHours].sort((a, b) => a - b))
  const dowStr = compactField([...activeDows].sort((a, b) => a - b))

  return `0 ${hourStr} * * ${dowStr}`
}

function compactField(nums: number[]): string {
  if (nums.length === 0) return '*'
  const ranges: string[] = []
  let start = nums[0], prev = nums[0]

  for (let i = 1; i <= nums.length; i++) {
    if (i < nums.length && nums[i] === prev + 1) {
      prev = nums[i]
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`)
      if (i < nums.length) { start = nums[i]; prev = nums[i] }
    }
  }
  return ranges.join(',')
}

export function CronEditor({ value, onChange }: CronEditorProps) {
  const [grid, setGrid] = useState(() => parseGrid(value))
  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState(false)

  const toggleCell = useCallback((day: number, hour: number, val?: boolean) => {
    setGrid(prev => {
      const next = prev.map(row => [...row])
      next[day][hour] = val ?? !prev[day][hour]
      onChange(gridToCron(next))
      return next
    })
  }, [onChange])

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Expression cron</Label>
        <Input
          value={value}
          onChange={e => {
            onChange(e.target.value)
            setGrid(parseGrid(e.target.value))
          }}
          placeholder="0 * * * *"
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label>Grille visuelle (jours / heures)</Label>
        <div className="overflow-x-auto">
          <div className="inline-block select-none">
            {/* Hour header */}
            <div className="flex">
              <div className="w-10" />
              {HOURS.map(h => (
                <div key={h} className="w-5 text-center text-[10px] text-muted-foreground">
                  {h}
                </div>
              ))}
            </div>
            {/* Grid rows */}
            {DAYS.map((day, di) => (
              <div key={day} className="flex items-center">
                <div className="w-10 text-xs text-muted-foreground pr-1 text-right">{day}</div>
                {HOURS.map(h => (
                  <div
                    key={h}
                    className={cn(
                      'w-5 h-5 border border-border cursor-pointer transition-colors',
                      grid[di][h] ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/10',
                    )}
                    onMouseDown={() => {
                      setIsDragging(true)
                      const newVal = !grid[di][h]
                      setDragValue(newVal)
                      toggleCell(di, h, newVal)
                    }}
                    onMouseEnter={() => {
                      if (isDragging) toggleCell(di, h, dragValue)
                    }}
                    onMouseUp={() => setIsDragging(false)}
                  />
                ))}
              </div>
            ))}
            <div onMouseUp={() => setIsDragging(false)} className="fixed inset-0 z-50 pointer-events-none" style={{ pointerEvents: isDragging ? 'auto' : 'none' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
