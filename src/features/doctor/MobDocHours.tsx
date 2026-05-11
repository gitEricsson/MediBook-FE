import { memo, useState, useEffect } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Card } from '@/components/primitives/Card'
import { Icon } from '@/components/primitives/Icon'
import { Toggle } from '@/components/forms/Toggle'
import { TimeField } from '@/components/forms/TimeField'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DoctorPortalService, WorkingHours } from '@/services/doctor-portal.service'
import { Skel } from '@/components/feedback/Skel'
import type { ChangeEvent } from 'react'

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default memo(function MobDocHours() {
  const queryClient = useQueryClient();
  const { data: serverHours, isLoading } = useQuery({
    queryKey: ['doctor', 'hours'],
    queryFn: DoctorPortalService.getWorkingHours,
  });

  const [hours, setHours] = useState<WorkingHours[]>([]);

  useEffect(() => {
    if (serverHours) {
      const byDay = new Map(serverHours.map((hour) => [hour.dayOfWeek, hour]));
      setHours([1,2,3,4,5,6,7].map((dayOfWeek) => byDay.get(dayOfWeek) ?? {
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: false,
      }));
    }
  }, [serverHours]);

  const saveMutation = useMutation({
    mutationFn: DoctorPortalService.updateWorkingHours,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'hours'] });
    }
  });

  const handleToggle = (dayIndex: number) => {
    setHours(prev => prev.map(h => h.dayOfWeek === dayIndex ? { ...h, isAvailable: !h.isAvailable } : h));
  };

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setHours(prev => prev.map(h => h.dayOfWeek === dayIndex ? { ...h, [field]: value } : h));
  };

  return (
    <MobScreen>
      <MobTopBar
        title="Working hours"
        right={
          <span 
            onClick={() => saveMutation.mutate(hours)}
            style={{ 
              fontSize: 13, 
              color: saveMutation.isPending ? MB.text4 : MB.primary, 
              fontWeight: 600, 
              cursor: saveMutation.isPending ? 'default' : 'pointer' 
            }}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </span>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ padding: 12, background: MB.primary50, borderRadius: 10, fontSize: 12, color: MB.primary600, marginBottom: 16, display: 'flex', gap: 8 }}>
          <Icon name="info" size={14} color={MB.primary600} />
          <span>Slots are auto-generated in 30-min intervals based on these hours.</span>
        </div>
        
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0,1,2,3,4,5,6].map(i => <Skel key={i} h={100} r={12} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hours.map(day => (
              <Card key={day.dayOfWeek} padding={14}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{DAY_NAMES[day.dayOfWeek]}</div>
                  <Toggle 
                    checked={day.isAvailable} 
                    onChange={() => handleToggle(day.dayOfWeek)}
                    label={`${DAY_NAMES[day.dayOfWeek]} toggle`} 
                  />
                </div>
                {day.isAvailable && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginTop: 12, alignItems: 'center' }}>
                    <TimeField 
                      value={day.startTime} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                      label="Start" 
                    />
                    <span style={{ color: MB.text3, fontSize: 12, paddingTop: 18 }}>to</span>
                    <TimeField 
                      value={day.endTime} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                      label="End" 
                    />
                  </div>
                )}
                {!day.isAvailable && (
                  <div style={{ marginTop: 8, fontSize: 12, color: MB.text3 }}>Closed for bookings</div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      <MobTabBar role="doctor" active="hours" />
    </MobScreen>
  )
})
