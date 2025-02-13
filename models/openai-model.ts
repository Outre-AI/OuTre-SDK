export const openAIModel = (accountBalance: number): { [key: string]: number } => {
    console.log(`Allocating assets based on an account balance of ${accountBalance}`);
    return { 'stocks': 0.6, 'bonds': 0.3, 'cash': 0.1 };
};
