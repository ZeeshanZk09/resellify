'use client';

import { format } from 'date-fns';
import { Calendar, CheckCircle, Clock, CreditCard, ExternalLink, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getUserBillingHistory, getUserSubscription } from '@/actions/billing/subscription';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

type PaymentTransaction = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  description: string | null;
  createdAt: Date;
  paidAt: Date | null;
  subscription: {
    id: string;
    plan: {
      name: string;
      type: string;
    };
  } | null;
};

type Subscription = {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  currentPeriodEnd: Date | null;
  plan: {
    name: string;
    type: string;
    price: number;
  };
};

export default function BillingHistory() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyResult, subscriptionResult] = await Promise.all([
        getUserBillingHistory(),
        getUserSubscription(),
      ]);

      if (historyResult.success && historyResult.data) {
        const data = historyResult.data as unknown[];
        setTransactions(
          data.map((t) => {
            const transaction = t as {
              amount: number | string | { toString(): string };
              [key: string]: unknown;
            };
            return {
              ...transaction,
              amount:
                typeof transaction.amount === 'number'
                  ? transaction.amount
                  : Number(transaction.amount),
            } as PaymentTransaction;
          })
        );
      }

      if (subscriptionResult.success && subscriptionResult.data) {
        const data = subscriptionResult.data as {
          plan: { price: number | string | { toString(): string } };
          [key: string]: unknown;
        };
        setSubscription({
          ...data,
          plan: {
            ...data.plan,
            price: typeof data.plan.price === 'number' ? data.plan.price : Number(data.plan.price),
          },
        } as Subscription);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return (
          <Badge variant='default' className='bg-green-500'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Paid
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant='secondary'>
            <Clock className='h-3 w-3 mr-1' />
            Pending
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant='destructive'>
            <XCircle className='h-3 w-3 mr-1' />
            Failed
          </Badge>
        );
      default:
        return <Badge variant='secondary'>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-32 bg-gray-200 rounded'></div>
          <div className='h-64 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              <Badge
                variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                className={subscription.status === 'ACTIVE' ? 'bg-green-500' : ''}
              >
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-600'>Plan</p>
                <p className='font-semibold'>{subscription.plan.name}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Price</p>
                <p className='font-semibold'>
                  PKR {Number(subscription.plan.price).toLocaleString()}/month
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Started</p>
                <p className='font-semibold'>
                  {format(new Date(subscription.startDate), 'MMM dd, yyyy')}
                </p>
              </div>
              {subscription.currentPeriodEnd && (
                <div>
                  <p className='text-sm text-gray-600'>Renews</p>
                  <p className='font-semibold'>
                    {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={handleManageBilling}
              disabled={portalLoading}
              variant='outline'
              className='w-full'
            >
              {portalLoading ? (
                'Loading...'
              ) : (
                <>
                  <ExternalLink className='h-4 w-4 mr-2' />
                  Manage Billing
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View all your past transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className='text-center py-8'>
              <CreditCard className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>No billing history found</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-center gap-4'>
                    <div className='p-2 bg-gray-100 rounded-lg'>
                      <CreditCard className='h-5 w-5 text-gray-600' />
                    </div>
                    <div>
                      <p className='font-semibold'>
                        {transaction.subscription?.plan.name || 'Subscription Payment'}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {transaction.description || 'Monthly subscription'}
                      </p>
                      <p className='text-xs text-gray-500 mt-1 flex items-center gap-2'>
                        <Calendar className='h-3 w-3' />
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold'>
                      {transaction.currency} {Number(transaction.amount).toLocaleString()}
                    </p>
                    <div className='mt-2'>{getStatusBadge(transaction.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
