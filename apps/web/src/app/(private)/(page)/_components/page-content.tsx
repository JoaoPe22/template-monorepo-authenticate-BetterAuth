import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const PageContent = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to the Home Page</CardTitle>
        <CardDescription>This is the main content of the page.</CardDescription>
      </CardHeader>
    </Card>
  )
}

export { PageContent }
